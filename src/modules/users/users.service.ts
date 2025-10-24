import { generateJwt, verifyJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { UserSafeSchema } from "./users.schema";
import { InsertUser, UserLoginRequest, UpdateUser, User, UserSafe, UserLoginConfirm, IPAddress, UserEmailVerification } from "./users.types";
import { loginDispatcher } from "../../core/dispatcher/login.dispatcher";
import { generateApiToken, hashString, verifyHash } from "../../core/utils/securities";
import AppConfig from "../../config/AppConfig";
import { sendEmailVerify } from "./users.email";
import * as logger from "../../core/utils/logger";
import { AppError } from "../../core/models/AppError.model";



/**
 * Creates a new user with the given information.
 * @param user The user object containing the information of the user to create.
 * @param ip The IP address of the user (can be null).
 * @returns JWT for the newly created user.
 * @throws Error if user creation or JWT generation fails.
 */
export async function insertUser(user: InsertUser, ip: IPAddress | null): Promise<string> {
    try {
        const email_verify_token = await generateApiToken();
        const insertedUser: User = await UsersRepository.insertUser(user, ip, await hashString(email_verify_token));
        const validatedUser: UserSafe = UserSafeSchema.parse(insertedUser);
        
        const url = `${AppConfig.base_url}/users/email/verify/${validatedUser.id}?token=${email_verify_token}`;
        logger.debug(`Email verification URL for user ${validatedUser.id}: ${url}`);
        if (!AppConfig.app_env.includes('dev')) {
            sendEmailVerify(user.email, AppConfig.app_name, url);
        }

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
        const decodedUserSafe = await verifyJwt(jwt);
        const selectedUser: User = await UsersRepository.getUser(decodedUserSafe);

        return UserSafeSchema.parse(selectedUser);
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
        const decodedUser = await verifyJwt(jwt);
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
        const decodedUser = await verifyJwt(jwt);
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
        const decodedUser = await verifyJwt(jwt);
        await UsersRepository.logoutUser(decodedUser);
    } catch (error) {
        throw error;
    }
}


/**
 * Verifies a user's email.
 * @param userEmailVerification The userEmailVerification object containing the information to verify user email.
 * @throws Error if email verification fails or if the information is invalid.
 */
export async function UserEmailVerify(userEmailVerification: UserEmailVerification): Promise<void> {
    try {
        const userId = parseInt(userEmailVerification.userId, 10);
        const token = userEmailVerification.token;

        const user = await UsersRepository._getUserById(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.is_verified_email) {
            throw new AppError("Email is already verified", 410);
        }

        if (!user.email_verify_token_hash) {
            throw new AppError("No email verification token found for this user", 400);
        }

        if (!await verifyHash(token, user.email_verify_token_hash)) {
            throw new AppError("Invalid token", 400);
        }

        await UsersRepository.UserEmailVerify(userId);
    } catch (error) {
        throw error;
    }
}