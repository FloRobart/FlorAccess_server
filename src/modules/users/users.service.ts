import { AppError } from "../../core/models/ErrorModel";
import { generateJwt, verifyJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { UserSafeSchema } from "./users.schema";
import { InsertUser, UserLoginRequest, UpdateUser, User, UserSafe } from "./users.types";
import { loginRequestDispatcher } from "../../core/dispatcher/login.dispatcher";



/**
 * Creates a new user with the given information.
 * @param user The user object containing the information of the user to create.
 * @param ip The IP address of the user (can be null).
 * @returns JWT for the newly created user.
 * @throws Error if user creation or JWT generation fails.
 */
export async function insertUser(user: InsertUser, ip: string | null): Promise<string> {
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
    let decodedUserSafe: UserSafe;
    try {
        decodedUserSafe = await verifyJwt(jwt);
    } catch (error) {
        throw new AppError({ message: "Invalid token", httpStatus: 401, stackTrace: error });
    }

    try {
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
    let decodedUser: UserSafe;
    try {
        decodedUser = await verifyJwt(jwt);
    } catch (error) {
        throw new AppError({ message: "Invalid token", httpStatus: 401, stackTrace: error });
    }

    try {
        const updatedUser: User = await UsersRepository.updateUser(updateUser, decodedUser);

        return generateJwt(UserSafeSchema.parse(updatedUser));
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
export async function deleteUser(jwt: string): Promise<boolean> {
    let decodedUser: UserSafe;
    try {
        decodedUser = await verifyJwt(jwt);
    } catch (error) {
        throw new AppError({ message: "Invalid token", httpStatus: 401, stackTrace: error });
    }

    try {
        await UsersRepository.deleteUser(decodedUser);

        return true;
    } catch (error) {
        throw new AppError({ message: "Internal server error", httpStatus: 500, stackTrace: error });
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
        return await loginRequestDispatcher(userLoginRequest);
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
export async function logoutUser(jwt: string): Promise<boolean> {
    let decodedUser: UserSafe;
    try {
        decodedUser = await verifyJwt(jwt);
    } catch (error) {
        throw new AppError({ message: "Invalid token", httpStatus: 401, stackTrace: error });
    }

    try {
        await UsersRepository.logoutUser(decodedUser);

        return true;
    } catch (error) {
        throw new AppError({ message: "Internal server error", httpStatus: 500, stackTrace: error });
    }
}