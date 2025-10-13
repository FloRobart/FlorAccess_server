import { AppError } from "../../core/models/ErrorModel";
import { generateJwt, verifyJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { UserSafeSchema } from "./users.schema";
import { InsertUser, UpdateUser, User, UserSafe } from "./users.types";



/**
 * Creates a new user with the given email and pseudo.
 * @param email The email address of the user to create.
 * @param pseudo The pseudo of the user to create.
 * @param ip The IP address of the user (can be null).
 * @returns Promise<string> JWT for the newly created user.
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
 * @returns User information or null if verification fails.
 * @throws Error if user retrieval fails.
 */
export async function selectUser(jwt: string): Promise<UserSafe> {
    let decodedUserSafe: UserSafe;
    try {
        decodedUserSafe = await verifyJwt(jwt);
    } catch (error) {
        throw new AppError({ message: "Invalid token", httpStatus: 401, stackTrace: error });
    }

    try {
        return UserSafeSchema.parse(await UsersRepository.getUser(decodedUserSafe));
    } catch (error) {
        throw error;
    }
}


/**
 * Updates a user in the database.
 * @param updateUser The user object containing the updated user information.
 * @param id The ID of the user to update.
 * @returns Promise<string> JWT for the newly updated user.
 * @throws Error if user update or JWT generation fails.
 */
export async function updateUser(updateUser: UpdateUser, jwt: string): Promise<string> {
    let decodedUser: UserSafe;
    try {
        decodedUser = await verifyJwt(jwt);
    } catch (error) {
        throw new AppError({ message: "Invalid token", httpStatus: 401, stackTrace: error });
    }

    try {
        const updatedUser: User = await UsersRepository.updateUser(updateUser, decodedUser.id);
        return generateJwt(UserSafeSchema.parse(updatedUser));
    } catch (error) {
        throw error;
    }
}