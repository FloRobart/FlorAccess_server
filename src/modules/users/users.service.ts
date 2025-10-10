import { generateJwt, verifyJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { UserSafeSchema } from "./users.schema";
import { InsertUser, UserSafe } from "./users.types";



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
        const insertedUser = await UsersRepository.insertUser(user, ip);
        const validatedUser = UserSafeSchema.parse(insertedUser);
        return await generateJwt(validatedUser);
    } catch (error) {
        throw error;
    }
}

/**
 * Vérifie le JWT et extrait les informations de l'utilisateur.
 * @param jwt JWT token to verify and extract user information from.
 * @returns User information or throws an error if verification fails.
 */
export async function selectUser(jwt: string): Promise<UserSafe | null> {
    let decodedUser: UserSafe;
    try {
        decodedUser = await verifyJwt(jwt);
    } catch (error) {
        return null;
    }

    try {
        const user = await UsersRepository.getUserById(decodedUser.id);
        return UserSafeSchema.parse(user);
    } catch (error) {
        throw error;
    }
}