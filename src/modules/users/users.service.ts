import type { InsertUser, UserLoginRequest, UpdateUser, User, UserSafe, UserLoginConfirm, UserLoginBlock, IPAddress, UserEmailVerification, UserUpdateResult } from "./users.types";

import { renewJwt, verifyJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { MINIMUM_PSEUDO_LENGTH, UserSafeSchema } from "./users.schema";
import { loginDispatcher } from "../../core/dispatcher/login.dispatcher";
import { generateApiToken, hashToken, verifyToken } from "../../core/utils/securities";
import AppConfig from "../../config/AppConfig";
import { sendEmailVerify } from "./users.email";
import logger from "../../core/utils/logger";
import { AppError } from "../../core/models/AppError.model";
import { getEmailTemplate } from '../../core/email/get_email_template';
import { assertEmailCanBeSent } from '../../core/email/mailer';
import escapeHtml from '../../core/utils/parse_html';
import { SlidingWindowCounter } from '../../core/utils/sliding_window_counter';



const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const NEW_ACCOUNT_LIMIT_REACHED_MESSAGE = "New accounts are temporarily unavailable, please try again later";

/**
 * Months during which an account keeps an email address which was never proven.
 * Anyone can create an account for any address, by registering it or by asking a login code for it:
 * an address which was not proven after this time will most likely never be, and belongs to someone who may never have asked for an account.
 */
export const UNVERIFIED_USER_RETENTION_IN_MONTHS = 3;

/**
 * Accounts created by the public routes over the last 24 hours (registration, first login code of an address).
 * Each new account receives an email: this limit keeps a flood of fake accounts from using up the daily limit of emails,
 * which the login codes of the existing users also need.
 */
const createdAccountsCounter = new SlidingWindowCounter(AppConfig.new_account_daily_limit, MILLISECONDS_PER_DAY);



/**
 * Registers a new user and sends him the link which verifies his email address.
 *
 * No JWT is given: anyone can register any address, so a session only starts once the address is proven,
 * by a login code sent to it. Nothing tells if the address was free or already used,
 * so that this route does not reveal which accounts exist.
 * @param user The user object containing the information of the user to create.
 * @param ip The IP address of the user (can be null).
 * @param application The application name from which the user is being created, displayed on the button of the verification page.
 * @param domain The domain associated with the user (can be null).
 * @throws AppError 503 if the daily limit of new accounts or of emails is reached, or Error if the user creation fails.
 */
export async function insertUser(user: InsertUser, ip: IPAddress | null, application: string, domain: string | null): Promise<void> {
    try {
        assertAccountCanBeCreated();

        const insertedUser: User | null = await createUserAndSendVerificationEmail(user, ip, application, domain);
        if (insertedUser !== null) { createdAccountsCounter.tryRecordEvent(); }
    } catch (error) {
        throw error;
    }
}


/**
 * Creates a user and sends him the link which verifies his email address.
 * @param user The user object containing the information of the user to create.
 * @param ip The IP address of the user (can be null).
 * @param application The application name from which the user is being created, displayed on the button of the verification page.
 * @param domain The domain associated with the user (can be null).
 * @returns The created user, or null if the email address is already used.
 * @throws Error if the user creation fails.
 */
export async function createUserAndSendVerificationEmail(user: InsertUser, ip: IPAddress | null, application: string, domain: string | null): Promise<User | null> {
    const emailVerifyToken = await generateApiToken();
    const insertedUser: User | null = await UsersRepository.insertUser(user, ip, hashToken(emailVerifyToken));
    if (insertedUser === null) { return null; }

    /* The registration does not wait for the email, but a failed sending must never stay unhandled : an unhandled rejection stops the server */
    sendVerificationEmail(insertedUser.id, insertedUser.email, emailVerifyToken, application, domain)
        .catch((error: unknown) => logger.error("Failed to send the verification email :", error));

    return insertedUser;
}


/**
 * Checks that a new account can be created by a public route, and that it can receive its email.
 * Called before the account is created, so that nothing is created when the answer is a refusal.
 * @throws AppError 503 if the daily limit of new accounts or of emails is reached.
 */
function assertAccountCanBeCreated(): void {
    if (!createdAccountsCounter.hasCapacity()) {
        throw new AppError(NEW_ACCOUNT_LIMIT_REACHED_MESSAGE, 503);
    }

    assertEmailCanBeSent();
}


/**
 * Vérifie le JWT et extrait les informations de l'utilisateur.
 * @param jwt JWT token to verify and extract user information from.
 * @returns UserSafe object containing the user's safe information.
 * @throws Error if user retrieval fails or if the token is invalid.
 */
export async function selectUser(jwt: string): Promise<UserSafe> {
    try {
        const decodedUserSafe = verifyJwt(jwt);
        const selectedUser: User = await UsersRepository.getUser(decodedUserSafe);

        return UserSafeSchema.parse(selectedUser);
    } catch (error) {
        throw error;
    }
}


/**
 * Vérifie le JWT, extrait les informations de l'utilisateur et génère un nouveau JWT.
 * @param jwt JWT token to verify and extract user information from.
 * @returns New JWT for the user.
 * @throws Error if user retrieval fails or if the token is invalid.
 */
export async function regenerateJwt(jwt: string): Promise<string> {
    try {
        const decodedUserSafe = verifyJwt(jwt);
        const selectedUser: User = await UsersRepository.getUser(decodedUserSafe);

        const userSafe: UserSafe = UserSafeSchema.parse(selectedUser);
        return renewJwt(jwt, userSafe);
    } catch (error) {
        throw error;
    }
}


/**
 * Updates a user's information.
 *
 * A change of email address gives no new JWT: the sessions are closed until the new address is proven.
 * @param updateUser The user object containing the updated user information.
 * @param jwt JWT token of the user to update.
 * @returns The new JWT of the user, or the information that his email address changed and that he has to log in again.
 * @throws Error if user update or JWT generation fails or if the token is invalid.
 */
export async function updateUser(updateUser: UpdateUser, jwt: string): Promise<UserUpdateResult> {
    try {
        const decodedUser: UserSafe = await getUserOfOpenSession(jwt);

        const hasEmailChanged = updateUser.email !== decodedUser.email;
        if (hasEmailChanged) {
            await changeEmailAndCloseSessions(updateUser, decodedUser);
            return { isEmailChanged: true };
        }

        const updatedUser: User = await UsersRepository.updateUser(updateUser, decodedUser);
        const userSafe: UserSafe = UserSafeSchema.parse(updatedUser);

        return { isEmailChanged: false, jwt: await renewJwt(jwt, userSafe) };
    } catch (error) {
        throw error;
    }
}


/**
 * Changes the email address of a user, then closes all his sessions until he proves the new address.
 *
 * Without this, anyone could take an email address he does not own and get a JWT for it at once.
 * When the new address is already used by another account, nothing changes but the sessions are closed as well:
 * the answer and its effects are the same, so that this route does not reveal which accounts exist.
 * @param updateUser The user object containing the updated user information.
 * @param currentUser The current information of the user, taken from his JWT.
 * @throws AppError 503 if the daily limit of emails is reached, or Error if the update fails or if the session is closed.
 */
async function changeEmailAndCloseSessions(updateUser: UpdateUser, currentUser: UserSafe): Promise<void> {
    assertEmailCanBeSent();
    const emailVerifyToken = await generateApiToken();

    const isEmailAlreadyUsed = (await UsersRepository._getUserByEmail(updateUser.email)) !== null;
    if (isEmailAlreadyUsed) {
        await UsersRepository.logoutUser(currentUser);
        return;
    }

    const updatedUser: User = await UsersRepository.updateUserWithUnverifiedEmail(updateUser, currentUser, hashToken(emailVerifyToken));

    /* The update does not wait for the email, but a failed sending must never stay unhandled : an unhandled rejection stops the server */
    sendVerificationEmail(updatedUser.id, updatedUser.email, emailVerifyToken)
        .catch((error: unknown) => logger.error("Failed to send the verification email :", error));
}


/**
 * Deletes a user from the database.
 * @param jwt JWT token of the user to delete.
 * @returns True if the user was deleted, false otherwise.
 * @throws AppError if user deletion fails or if the token is invalid.
 */
export async function deleteUser(jwt: string): Promise<void> {
    try {
        const decodedUser: UserSafe = await getUserOfOpenSession(jwt);
        await UsersRepository.deleteUser(decodedUser);
    } catch (error) {
        throw error;
    }
}


/**
 * Reads the user of a JWT, once its signature is checked and its session is known to be still open.
 *
 * The routes which act on the account of a JWT go through it: a closed session, or the session of an address
 * which was never proven, can change nothing, and its refusal is the same whatever the request asks for.
 * @param jwt JWT token of the session.
 * @returns The user, as written in the JWT.
 * @throws AppError 401 if the JWT is invalid or if its session is closed, 404 if its user does not exist anymore.
 */
async function getUserOfOpenSession(jwt: string): Promise<UserSafe> {
    const decodedUser: UserSafe = verifyJwt(jwt);
    await UsersRepository.getUser(decodedUser);

    return decodedUser;
}


/**
 * Logs in a user by generating a JWT based on the user's information.
 * @param loginUser The loginUser object containing the information of the user to log in.
 * @returns JWT for the user.
 * @throws Error if login fails or if the information is invalid.
 */
export async function userLoginRequest(userLoginRequest: UserLoginRequest, ip: IPAddress | null): Promise<string> {
    try {
        /* Create the user if it doesn't exist */
        const user = await UsersRepository._getUserByEmail(userLoginRequest.email);
        if (user === null) {
            await createAccountForLoginRequest(userLoginRequest.email, ip);
        }

        /* Dispatch the login request to the appropriate authentication method handler */
        return await loginDispatcher(userLoginRequest);
    } catch (error) {
        throw error;
    }
}


/**
 * Creates the account of an email address which asks for a login code for the first time: the login also registers the users.
 * The email verification token is never sent, the login code proves the address.
 * @param email The email address which asks for a login code.
 * @param ip The IP address of the user (can be null).
 * @throws AppError 503 if the daily limit of new accounts or of emails is reached, or Error if the user creation fails.
 */
async function createAccountForLoginRequest(email: string, ip: IPAddress | null): Promise<void> {
    assertAccountCanBeCreated();

    const emailVerifyToken = await generateApiToken();
    const userToInsert: InsertUser = {
        email: email,
        pseudo: buildDefaultPseudo(email),
    };

    /* null when a request sent at the same time already created this account: the login goes on with it */
    const insertedUser: User | null = await UsersRepository.insertUser(userToInsert, ip, hashToken(emailVerifyToken));
    if (insertedUser !== null) { createdAccountsCounter.tryRecordEvent(); }
}


/**
 * Builds the pseudo of an account created by a login request, from the start of its email address.
 * A shorter start than the minimum length of a pseudo is completed with "_": the pseudo would otherwise be refused
 * when the user is validated at each login, and the account could never log in.
 * @param email The email address of the account.
 * @returns The pseudo of the account.
 */
function buildDefaultPseudo(email: string): string {
    return email.split('@')[0].padEnd(MINIMUM_PSEUDO_LENGTH, '_');
}


/**
 * Confirms a user's login.
 * @param userLoginConfirm The userLoginConfirm object containing the information to confirm user login.
 * @returns JWT for the user.
 * @throws Error if login confirmation fails or if the information is invalid.
 */
export async function userLoginConfirm(userLoginConfirm: UserLoginConfirm): Promise<string> {
    try {
        return await loginDispatcher(userLoginConfirm);
    } catch (error) {
        throw error;
    }
}


/**
 * Deletes the users whose email address was not proven within UNVERIFIED_USER_RETENTION_IN_MONTHS months after their creation.
 * @returns The number of deleted users.
 * @throws Error if the deletion fails.
 */
export async function deleteExpiredUnverifiedUsers(): Promise<number> {
    return await UsersRepository.deleteUnverifiedUsersCreatedBefore(UNVERIFIED_USER_RETENTION_IN_MONTHS);
}


/**
 * Logs out a user by invalidating the JWT token.
 * @param jwt JWT token of the user to log out.
 * @returns True if the user was logged out, throw error otherwise.
 * @throws AppError if logout fails or if the token is invalid.
 */
export async function logoutUser(jwt: string): Promise<void> {
    try {
        const decodedUser: UserSafe = await getUserOfOpenSession(jwt);
        await UsersRepository.logoutUser(decodedUser);
    } catch (error) {
        throw error;
    }
}


/**
 * Sends a verification email to the user.
 *
 * The name of the application only goes in the link, for the button of the verification page:
 * it comes from the client, so it is never written in the email itself.
 * @param userId The ID of the user to send the verification email to.
 * @param userEmail The email address of the user.
 * @param email_verify_token The email verification token.
 * @param application The name of the application. Defaults to AppConfig.app_name.
 * @param domain The domain of the application. Defaults to null.
 * @throws Error if sending the verification email fails.
 */
export async function sendVerificationEmail(userId: number, userEmail: string, email_verify_token: string, application: string = AppConfig.app_name, domain: string | null = null): Promise<void> {
    try {
        const url = `${AppConfig.base_url}/users/email/verify/${userId}?token=${email_verify_token}&application=${encodeURIComponent(application)}&domain=${encodeURIComponent(domain || 'null')}`;
        logger.debug(`Email verification URL for user ${userId}: ${url}`);
        if (!AppConfig.app_env.includes('dev')) {
            await sendEmailVerify(userEmail, url);
        }
    } catch (error) {
        throw error;
    }
}


/**
 * Builds the button which sends the user back to the application he comes from.
 *
 * The application and the domain come from the URL, which anyone can write : the button is only built
 * for the domains of the applications allowed to use this API, otherwise this page could display a link to any website.
 * @param application Name of the application, displayed on the button.
 * @param domain Domain of the application, target of the button.
 * @returns HTML string of the button, or an empty string if there is no allowed application to go back to.
 */
function buildApplicationButton(application: string | undefined, domain: string | undefined): string {
    if (application === undefined || domain === undefined) { return ''; }
    if (!isAllowedApplicationDomain(domain)) { return ''; }

    return `<a class="btn" href="https://${escapeHtml(domain)}">Aller sur ${escapeHtml(application)}</a>`;
}


/**
 * Checks if a domain is the one of an application allowed to use this API.
 *
 * The allowed applications are the origins of the CORS configuration, there is no second list to maintain.
 * @param domain Domain to check (example: "example.com").
 * @returns True if the domain belongs to an allowed application.
 */
function isAllowedApplicationDomain(domain: string): boolean {
    const allowedDomains: (string | null)[] = AppConfig.corsOptions.origin.map(getOriginHost);
    return allowedDomains.includes(domain.toLowerCase());
}


/**
 * Extracts the host of an origin.
 * @param origin Origin to read (example: "https://example.com").
 * @returns Host of the origin (example: "example.com"), or null if the origin is not a valid URL.
 */
function getOriginHost(origin: string): string | null {
    try {
        return new URL(origin).host;
    } catch (error) {
        return null;
    }
}


/*====================*/
/* Email verification */
/*====================*/
const INVALID_EMAIL_VERIFICATION_LINK_MESSAGE = "Ce lien de vérification n'est pas valide ou a déjà été utilisé. Si votre adresse email est déjà confirmée, vous pouvez vous connecter. Sinon, connectez-vous avec un code reçu par email : il confirme aussi votre adresse.";

/**
 * Verifies a user's email.
 *
 * An unknown user, an address already verified and a wrong token all display the same page:
 * the links can be written by anyone, they must not tell which accounts exist or are verified.
 * @param userEmailVerification The userEmailVerification object containing the information to verify user email.
 * @return HTML string to display the result of the email verification.
 */
export async function UserEmailVerify(userEmailVerification: UserEmailVerification): Promise<string> {
    const applicationButton: string = buildApplicationButton(userEmailVerification.application, userEmailVerification.domain);

    try {
        const user: User = await getUserFromEmailVerificationLink(userEmailVerification);
        await UsersRepository.UserEmailVerify(user.id);

        return await getEmailTemplate('verification_email_success', {
            status: `Email '${user.email}' confirmé`,
            message: `Merci — votre adresse email a bien été vérifiée. Vous pouvez maintenant vous connecter.`,
        }, { button: applicationButton });

    } catch (error) {
        const isInvalidLink = error instanceof AppError && error.httpStatus < 500;
        if (isInvalidLink) {
            return await getEmailTemplate('verification_email_error', {
                status: `Lien invalide`,
                message: INVALID_EMAIL_VERIFICATION_LINK_MESSAGE,
            }, { button: applicationButton });
        }

        logger.error("Unknown error in UserEmailVerify :", error);
        return await getEmailTemplate('verification_email_error', {
            status: `Erreur Inconnue`,
            message: `Une erreur inconnue est survenue lors de la vérification de votre adresse email. Veuillez réessayer plus tard.`,
        }, { button: applicationButton });
    }
}


/**
 * Retrieves the user targeted by an email verification link, after checking the token of the link.
 *
 * The token is erased once the address is verified, so a verified address is refused like a wrong token.
 * @param userEmailVerification The userEmailVerification object containing the user ID and the token of the link.
 * @returns The user whose address the link verifies.
 * @throws AppError 404 if the user does not exist, 400 if the address is already verified or if the token does not match.
 */
async function getUserFromEmailVerificationLink(userEmailVerification: UserEmailVerification): Promise<User> {
    const user: User = await UsersRepository._getUserById(parseInt(userEmailVerification.userId, 10));

    const tokenHash = user.email_verify_token_hash;
    if (user.is_verified_email || tokenHash === null || !(await verifyToken(userEmailVerification.token, tokenHash))) {
        throw new AppError("Invalid email verification link", 400);
    }

    return user;
}


/*=============*/
/* Login block */
/*=============*/
const INVALID_LOGIN_BLOCK_LINK_MESSAGE = "Invalid login block link";

/**
 * Builds the page which asks the user to confirm that he wants to block the logins on his account.
 *
 * The link of the email only opens this page, the block itself needs the form to be sent :
 * some email clients open the links of the emails by themselves and would block the account without the user.
 * The token is checked before the page is built, because the page displays the email address of the account.
 * @param userLoginBlock The userLoginBlock object containing the user ID and the token of the block link.
 * @returns HTML string of the confirmation page, or of the result page if the link is not valid.
 */
export async function getUserLoginBlockPage(userLoginBlock: UserLoginBlock): Promise<string> {
    try {
        const user: User = await getUserFromLoginBlockLink(userLoginBlock);

        return await getEmailTemplate('login_block_confirmation', {
            email: user.email,
            blockDuration: `${getLoginBlockDurationInHours()} h`,
            currentYear: String(new Date().getFullYear()),
        });
    } catch (error) {
        return await getLoginBlockFailurePage(error);
    }
}


/**
 * Blocks the logins of a user from the link of a login code email.
 *
 * If someone logged in with the code of this email, the user is also logged out from all his devices.
 * @param userLoginBlock The userLoginBlock object containing the user ID and the token of the block link.
 * @returns HTML string to display the result of the block.
 */
export async function blockUserLogin(userLoginBlock: UserLoginBlock): Promise<string> {
    try {
        const user = await getUserFromLoginBlockLink(userLoginBlock);

        const mustLogoutFromAllDevices = wasLastLoginCodeUsed(user);
        const isLoginBlocked = await UsersRepository.blockUserLogin(user.id, user.login_block_token_hash, AppConfig.login_block_duration, mustLogoutFromAllDevices);
        if (!isLoginBlocked) {
            throw new AppError(INVALID_LOGIN_BLOCK_LINK_MESSAGE, 400);
        }

        const logoutMessage = mustLogoutFromAllDevices ? ` Quelqu'un s'était connecté avec le code reçu : votre compte a été déconnecté de tous les appareils.` : ``;

        return await getLoginBlockResultPage(
            "success",
            `Connexions bloquées`,
            `Plus personne ne peut se connecter à votre compte pendant ${getLoginBlockDurationInHours()} h, le blocage se lèvera ensuite automatiquement.${logoutMessage}`,
        );
    } catch (error) {
        return await getLoginBlockFailurePage(error);
    }
}


/**
 * Retrieves the user targeted by a block link, after checking the token of the link.
 * @param userLoginBlock The userLoginBlock object containing the user ID and the token of the block link.
 * @returns The user, with a block token hash which is never null.
 * @throws AppError if the user does not exist or if the token does not match his block link.
 */
async function getUserFromLoginBlockLink(userLoginBlock: UserLoginBlock): Promise<User & { login_block_token_hash: string }> {
    const user: User = await UsersRepository._getUserById(parseInt(userLoginBlock.userId, 10));

    const blockTokenHash = user.login_block_token_hash;
    if (blockTokenHash === null || !(await verifyToken(userLoginBlock.token, blockTokenHash))) {
        throw new AppError(INVALID_LOGIN_BLOCK_LINK_MESSAGE, 400);
    }

    return { ...user, login_block_token_hash: blockTokenHash };
}


/**
 * Builds the page displayed when a block link can not be used.
 *
 * The same page is returned for an unknown user and for a wrong token, so that the link does not reveal which accounts exist.
 * @param error The error which prevented the use of the block link.
 * @returns HTML string of the result page.
 */
async function getLoginBlockFailurePage(error: unknown): Promise<string> {
    const isInvalidLink = error instanceof AppError && error.httpStatus < 500;
    if (isInvalidLink) {
        return await getLoginBlockResultPage(
            "invalid",
            `Lien invalide`,
            `Ce lien de blocage n'est plus valide. Si vous venez de bloquer les connexions, votre compte est déjà protégé.`,
        );
    }

    logger.error("Error with a login block link :", error);
    return await getLoginBlockResultPage(
        "error",
        `Erreur`,
        `Une erreur est survenue lors du blocage des connexions. Veuillez réessayer plus tard.`,
    );
}


/**
 * Builds the page which displays the result of a login block.
 * @param statusKind The kind of result, which selects the icon and the color of the page.
 * @param status The title of the page.
 * @param message The explanation displayed under the title.
 * @returns HTML string of the result page.
 */
async function getLoginBlockResultPage(statusKind: "success" | "invalid" | "error", status: string, message: string): Promise<string> {
    return await getEmailTemplate('login_block', {
        statusKind: statusKind,
        status: status,
        message: message,
        currentYear: String(new Date().getFullYear()),
    });
}


/**
 * Checks if someone logged in with the last login code sent to a user.
 * @param user The user who received the login code.
 * @returns True if a login happened after the last login code was sent.
 */
function wasLastLoginCodeUsed(user: User): boolean {
    if (user.login_requested_at === null) { return false; }

    return user.last_login.getTime() >= user.login_requested_at.getTime();
}


/**
 * Converts the duration of the login block into hours, to display it to the user.
 * @returns Duration of the login block in hours, rounded up.
 */
function getLoginBlockDurationInHours(): number {
    const millisecondsPerHour = 60 * 60 * 1000;
    return Math.ceil(AppConfig.login_block_duration / millisecondsPerHour);
}
