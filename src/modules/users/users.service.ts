import type { InsertUser, UserLoginRequest, UpdateUser, User, UserSafe, UserLoginConfirm, IPAddress, UserEmailVerification } from "./users.types";

import { generateJwt, verifyJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { UserSafeSchema } from "./users.schema";
import { loginDispatcher } from "../../core/dispatcher/login.dispatcher";
import { generateApiToken, hashString, verifyHash } from "../../core/utils/securities";
import AppConfig from "../../config/AppConfig";
import { sendEmailVerify } from "./users.email";
import logger from "../../core/utils/logger";
import { AppError } from "../../core/models/AppError.model";
import { getEmailTemplate } from '../../core/email/get_email_template';



/**
 * Creates a new user with the given information.
 * @param user The user object containing the information of the user to create.
 * @param ip The IP address of the user (can be null).
 * @param application The application name from which the user is being created.
 * @param domain The domain associated with the user (can be null).
 * @returns JWT for the newly created user.
 * @throws Error if user creation or JWT generation fails.
 */
export async function insertUser(user: InsertUser, ip: IPAddress | null, application: string, domain: string | null): Promise<string> {
    try {
        const email_verify_token = await generateApiToken();
        const insertedUser: User = await UsersRepository.insertUser(user, ip, await hashString(email_verify_token));
        const validatedUser: UserSafe = UserSafeSchema.parse(insertedUser);

        sendVerificationEmail(insertedUser.id, insertedUser.email, email_verify_token, application, domain);

        return await generateJwt(validatedUser);
    } catch (error) {
        throw error;
    }
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
        return generateJwt(userSafe);
    } catch (error) {
        throw error;
    }
}


/**
 * Updates a user's information.
 * @param updateUser The user object containing the updated user information.
 * @param jwt JWT token of the user to update.
 * @returns JWT for the newly updated user.
 * @throws Error if user update or JWT generation fails or if the token is invalid.
 */
export async function updateUser(updateUser: UpdateUser, jwt: string): Promise<string> {
    try {
        const decodedUser = verifyJwt(jwt);
        const updatedUser: User = await UsersRepository.updateUser(updateUser, decodedUser);

        const userSafe: UserSafe = UserSafeSchema.parse(updatedUser);
        return generateJwt(userSafe);
    } catch (error) {
        throw error;
    }
}


/**
 * Deletes a user from the database.
 * @param jwt JWT token of the user to delete.
 * @returns True if the user was deleted, false otherwise.
 * @throws AppError if user deletion fails or if the token is invalid.
 */
export async function deleteUser(jwt: string): Promise<void> {
    try {
        const decodedUser = verifyJwt(jwt);
        await UsersRepository.deleteUser(decodedUser);
    } catch (error) {
        throw error;
    }
}


/**
 * Logs in a user by generating a JWT based on the user's information.
 * @param loginUser The loginUser object containing the information of the user to log in.
 * @returns JWT for the user.
 * @throws Error if login fails or if the information is invalid.
 */
export async function userLoginRequest(userLoginRequest: UserLoginRequest): Promise<string> {
    try {
        return await loginDispatcher(userLoginRequest);
    } catch (error) {
        throw error;
    }
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
 * Logs out a user by invalidating the JWT token.
 * @param jwt JWT token of the user to log out.
 * @returns True if the user was logged out, throw error otherwise.
 * @throws AppError if logout fails or if the token is invalid.
 */
export async function logoutUser(jwt: string): Promise<void> {
    try {
        const decodedUser = verifyJwt(jwt);
        await UsersRepository.logoutUser(decodedUser);
    } catch (error) {
        throw error;
    }
}


/**
 * Sends a verification email to the user.
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
            sendEmailVerify(userEmail, application, url);
        }
    } catch (error) {
        throw error;
    }
}


/**
 * Verifies a user's email.
 * @param userEmailVerification The userEmailVerification object containing the information to verify user email.
 * @return HTML string to display the result of the email verification.
 * @throws Error if email verification fails or if the information is invalid.
 */
export async function UserEmailVerify(userEmailVerification: UserEmailVerification): Promise<string> {
    const application: string | undefined = userEmailVerification.application;
    const domain: string | undefined = userEmailVerification.domain === 'null' ? undefined : userEmailVerification.domain;

    try {
        const userId = parseInt(userEmailVerification.userId, 10);
        const token = userEmailVerification.token;

        const user = await UsersRepository._getUserById(userId);

        if (!user) {
            throw new AppError("Utilisateur non trouvé. Cet incident sera signalé.", 404);
        }

        if (user.is_verified_email) {
            return await getEmailTemplate('verification_email_success', {
                status: `Email '${user.email}' déjà confirmé`,
                message: `Merci — votre adresse email à déjà été vérifiée.`,
                button: (application !== undefined && domain !== undefined) ? `<a class="btn" href="https://${domain}">Aller sur ${application}</a>` : '',
            });
        }

        if (!user.email_verify_token_hash) {
            throw new AppError("Nous ne pouvons pas vérifier votre adresse email en toute sécurité pour le moment. Demandez un nouveau lien de vérification à l'administrateur.", 400);
        }

        if (!await verifyHash(token, user.email_verify_token_hash)) {
            throw new AppError("Token invalide. Cet incident sera signalé.", 400);
        }

        await UsersRepository.UserEmailVerify(userId);

        return await getEmailTemplate('verification_email_success', {
            status: `Email '${user.email}' confirmé`,
            message: `Merci — votre adresse email a bien été vérifiée. Vous pouvez maintenant vous connecter.`,
            button: (application !== undefined && domain !== undefined) ? `<a class="btn" href="https://${domain}">Aller sur ${application}</a>` : '',
        });

    } catch (error) {
        if (error instanceof AppError) {
            return await getEmailTemplate('verification_email_error', {
                status: `Erreur ${error.httpStatus}`,
                message: `${error.message}`,
                button: (application !== undefined && domain !== undefined) ? `<a class="btn" href="https://${domain}">Aller sur ${application}</a>` : '',
            });
        }

        logger.error("Unknown error in UserEmailVerify :", error);
        return await getEmailTemplate('verification_email_error', {
            status: `Erreur Inconnue`,
            message: `Une erreur inconnue est survenue lors de la vérification de votre adresse email. Veuillez réessayer plus tard.`,
            button: (application !== undefined && domain !== undefined) ? `<a class="btn" href="https://${domain}">Aller sur ${application}</a>` : '',
        });
    }
}
