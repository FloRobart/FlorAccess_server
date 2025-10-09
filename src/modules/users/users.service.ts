import { generateJwt } from "../../core/utils/securities";
import * as UsersRepository from "./users.repository";
import { User } from "./users.types";




/**
 * Creates a new user with the given email and name.
 * @param email 
 * @param name 
 * @returns Promise<User>
 * @throws AppError with httpStatus 400 if the email is invalid.
 */
export async function createUser(email: string, name: string, ip: string | null): Promise<string> {
    // return UsersRepository.createUser(email, null, name);

    try {
        const user = await UsersRepository.createUser(email, name, ip);
        const jwt = await generateJwt(user);
        return jwt;
    } catch (error) {
        throw error;
    }
}