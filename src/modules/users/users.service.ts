import { AppError } from "../../core/models/AppError.model";
import { generateJwt, verifyJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { UserSafeSchema } from "./users.schema";
import { InsertUser, UserLoginRequest, UpdateUser, User, UserSafe, UserLoginConfirm, IPAddress } from "./users.types";
import { loginDispatcher } from "../../core/dispatcher/login.dispatcher";



/**
 * Creates a new user with the given information.
 * @param user The user object containing the information of the user to create.
 * @param ip The IP address of the user (can be null).
 * @returns JWT for the newly created user.
 * @throws Error if user creation or JWT generation fails.
 */
export async function insertUser(user: InsertUser, ip: IPAddress | null): Promise<string> {
    try {
        const insertedUser: User = await UsersRepository.insertUser(user, ip);
        const validatedUser: UserSafe = UserSafeSchema.parse(insertedUser);

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