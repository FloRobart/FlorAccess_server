import AppConfig from "../../../../config/AppConfig";
import { User, UserLoginConfirm, UserSafe } from "../../users.types";
import { sendEmailCode } from "./code.email";
import * as CodeRepository from "./code.repository";
import * as UsersRepository from "../../users.repository";
import { getRandomValues } from "node:crypto";
import { generateApiToken, generateSecureRandomDelay, hashString, hashToken, verifyHash, verifyToken } from "../../../../core/utils/securities";
import { generateJwt } from "../../../../core/utils/jwt";
import { UserSafeSchema } from "../../users.schema";
import logger from "../../../../core/utils/logger";
import { AppError } from "../../../../core/models/AppError.model";
import { assertEmailCanBeSent } from "../../../../core/email/mailer";



/* Refusal of a confirmation without the right token or code: the same for every account, known or not */
export const INVALID_LOGIN_TOKEN_MESSAGE = "Invalid token";

const LOGIN_REQUEST_COOLDOWN_MESSAGE = "A login code was sent recently. Please wait before requesting a new one";
const TOO_MANY_LOGIN_CODES_MESSAGE = "Too many login codes were sent without a successful login, the logins of this account are temporarily blocked";

/* Number of login codes which can be sent without a successful login before the extended cooldown applies */
const LOGIN_CODES_BEFORE_EXTENDED_COOLDOWN = 5;

/* Number of login codes sent without a successful login after which the logins of the account are blocked */
const LOGIN_CODES_BEFORE_LOGIN_BLOCK = 10;



/**
 * Generates a login request for a user using email code authentication.
 * @param user The user object containing the information of the user.
 * @returns Token to give when confirming connection
 */
export async function usersLoginRequest(user: User): Promise<string> {
    try {
        const cooldown: number = getLoginRequestCooldown(user.login_requests_without_login);

        /* Early refusal which avoids the cost of the hashes, the query below is the one which enforces the cooldown. */
        if (isLoginRequestInCooldown(user, cooldown)) {
            throw new AppError(LOGIN_REQUEST_COOLDOWN_MESSAGE, 429);
        }

        /* Checked after the cooldown, so that the last code stays usable until the time between two codes is over. */
        /* The block lasts as long as the one of the block link, then the count of the codes starts again from zero. */
        if (hasTooManyLoginCodesWithoutLogin(user)) {
            await CodeRepository.blockLoginsAfterTooManyCodes(user, AppConfig.login_block_duration);
            logger.warning(`Logins of user-${user.id} blocked: ${user.login_requests_without_login} login codes were sent without a successful login`);
            throw new AppError(TOO_MANY_LOGIN_CODES_MESSAGE, 403);
        }

        /* Checked before the code is stored: a code which can not be sent must not count, nor start a cooldown */
        assertEmailCanBeSent();

        /* Generated together, because each of these steps waits a random delay on purpose */
        const [token, blockToken, code] = await Promise.all([generateApiToken(), generateApiToken(), generateCode(6)]);

        /* Only the short code needs the slow Argon2 hash, the long random tokens use a fast keyed hash */
        const codeHash: string = await hashString(code);

        const isLoginCodeStored = await CodeRepository.userLoginRequest(user, hashToken(token), codeHash, hashToken(blockToken), cooldown);
        if (!isLoginCodeStored) {
            throw new AppError(LOGIN_REQUEST_COOLDOWN_MESSAGE, 429);
        }

        const loginBlockUrl = `${AppConfig.base_url}/users/login/block/${user.id}?token=${blockToken}`;
        logger.debug(`Login block URL for user ${user.id}: ${loginBlockUrl}`);

        if (!AppConfig.app_env.includes('dev')) {
            await sendEmailCode(user.email, AppConfig.app_name, code, loginBlockUrl);
        } else {
            logger.debug(`Login code for user ${user.id} is: ${code}`);
            logger.debug(`Login block URL for user ${user.id}: ${loginBlockUrl}`);
        }

        return token;
    } catch (error) {
        throw error;
    }
}


/**
 * Generates a login confirmation for a user using email code authentication.
 * @param user The user object containing the information of the user.
 * @returns JWT for the authenticated user.
 */
export async function usersLoginConfirm(user: User, userLoginConfirm: UserLoginConfirm): Promise<string> {
    try {
        if (user.secret_hash === null || user.token_hash === null || user.login_requested_at === null) {
            throw new AppError(INVALID_LOGIN_TOKEN_MESSAGE, 401);
        }

        /* The token proves that the confirmation comes from the device which requested the code. */
        /* Until it is checked, every refusal is the same: a confirmation must not tell anything about the account of an address. */
        /* It is also checked before an attempt is counted, so that a third party can not use up the attempts of the user. */
        if (!(await verifyToken(userLoginConfirm.token, user.token_hash))) {
            throw new AppError(INVALID_LOGIN_TOKEN_MESSAGE, 401);
        }

        if (isLoginCodeExpired(user.login_requested_at)) {
            throw new AppError("Token has expired", 401);
        }

        const hasAttemptLeft = await CodeRepository.consumeLoginCodeAttempt(user.id, user.token_hash, AppConfig.login_code_max_attempts);
        if (!hasAttemptLeft) {
            throw new AppError("Too many attempts. Please request a new code", 429);
        }

        if (!(await verifyHash(userLoginConfirm.secret, user.secret_hash))) {
            throw new AppError(INVALID_LOGIN_TOKEN_MESSAGE, 401);
        }


        const loggedInUser: User = await CodeRepository.userLoginConfirm(user, userLoginConfirm.ip);
        const updatedUser: User = await closeSessionsOpenedBeforeEmailProof(user, loggedInUser);
        const userSafe: UserSafe = UserSafeSchema.parse(updatedUser);

        return generateJwt(userSafe);
    } catch (error) {
        throw error;
    }
}


/**
 * Computes the minimum time between the last login code of a user and the next one.
 *
 * The first codes are only separated by the base cooldown. Once LOGIN_CODES_BEFORE_EXTENDED_COOLDOWN codes were sent
 * without a successful login, each new code needs the extended cooldown: someone who tries to guess the codes of an account
 * is slowed down, while a user who logs in normally never waits more than the base cooldown.
 * A successful login starts the count again.
 * @param codesSentWithoutLogin Number of login codes sent since the last successful login.
 * @returns The cooldown in milliseconds.
 */
export function getLoginRequestCooldown(codesSentWithoutLogin: number): number {
    if (codesSentWithoutLogin < LOGIN_CODES_BEFORE_EXTENDED_COOLDOWN) { return AppConfig.login_request_cooldown; }

    return AppConfig.login_request_extended_cooldown;
}


/**
 * Checks if a user received so many login codes without a successful login that his logins must be blocked.
 *
 * Nobody who owns the email address fails so many codes in a row: someone is trying to guess the codes of this account.
 * @param user The user who requests a new login code.
 * @returns True if the logins of the user must be blocked instead of sending him a new code.
 */
function hasTooManyLoginCodesWithoutLogin(user: User): boolean {
    return user.login_requests_without_login >= LOGIN_CODES_BEFORE_LOGIN_BLOCK;
}


/**
 * Checks if a login code is pending and was sent too recently to send another one.
 *
 * Without this delay, the limit of attempts per code could be bypassed by requesting new codes in a loop.
 * A code which was already used does not start a cooldown, so that a user can log in again right after a logout.
 * @param user The user who requests a new login code.
 * @param cooldown The minimum time between two login codes for this user, in milliseconds.
 * @returns True if the user has to wait before requesting a new code.
 */
function isLoginRequestInCooldown(user: User, cooldown: number): boolean {
    if (user.secret_hash === null || user.login_requested_at === null) { return false; }

    const timeSinceLastRequest = Date.now() - user.login_requested_at.getTime();
    return timeSinceLastRequest < cooldown;
}


/**
 * Checks if a login code is too old to be used.
 *
 * The age is computed from the date stored in the database, never from a value sent by the client.
 * @param loginRequestedAt Date when the login code was sent.
 * @returns True if the login code has expired.
 */
function isLoginCodeExpired(loginRequestedAt: Date): boolean {
    const loginCodeAge = Date.now() - loginRequestedAt.getTime();
    return loginCodeAge > AppConfig.token_expiration;
}


/**
 * Generates a random code.
 * @param length Length of the code to generate
 * @returns A promise that resolves to the generated code.
 */
async function generateCode(length: number): Promise<string> {
    try {
        const chars = AppConfig.code_data_set;
        const charsLength = chars.length;
        const maxRandomValue = 0xFFFFFFFF; // Valeur max d'un Uint32
        const mask = Math.floor(maxRandomValue / charsLength) * charsLength;
        let result = '';
        const values = new Uint32Array(length);

        while (result.length < length) {
            getRandomValues(values);
            for (let i = 0; i < values.length && result.length < length; i++) {
                // On rejette les valeurs qui introduiraient un biais
                const randomValue = values[i];
                if (randomValue < mask) {
                    result += chars[randomValue % charsLength];
                }
            }
        }

        await generateSecureRandomDelay();
        return result;
    } catch (error) {
        throw error;
    }
}


/**
 * Closes the sessions opened on an account before its email address was proven for the first time.
 *
 * Anyone can register an account with an email address he does not own and get a JWT for it.
 * When the real owner of the address proves it with a login code, these earlier JWT must stop working.
 * @param userBeforeLogin The user as he was before this login.
 * @param loggedInUser The user returned by the login confirmation.
 * @returns The user to use to generate the JWT of this login.
 */
async function closeSessionsOpenedBeforeEmailProof(userBeforeLogin: User, loggedInUser: User): Promise<User> {
    if (userBeforeLogin.is_verified_email) { return loggedInUser; }

    return await UsersRepository.invalidateUserSessions(loggedInUser.id);
}
