import { generateJwt } from "../../core/utils/jwt";
import * as UsersRepository from "./users.repository";
import { UserSafeSchema } from "./users.schema";
import * as logger from '../../core/utils/logger';




/**
 * Creates a new user with the given email and pseudo.
 * @param email 
 * @param pseudo 
 * @returns Promise<User>
 * @throws AppError with httpStatus 400 if the email is invalid.
 */
export async function createUser(email: string, pseudo: string, ip: string | null): Promise<string> {
    try {
        const user = await UsersRepository.createUser(email, pseudo, ip);
        const validatedUser = UserSafeSchema.parse(user);
        logger.debug(`validatedUser : ${JSON.stringify(validatedUser)}`);
        return await generateJwt(validatedUser);
    } catch (error) {
        throw error;
    }
}