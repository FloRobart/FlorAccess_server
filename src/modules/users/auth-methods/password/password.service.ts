import { AppError } from "../../../../core/models/AppError.model";
import { User } from "../../users.types";



/**
 * Generates a login request for a user using password authentication.
 * @param user The user object containing the information of the user.
 * @returns Token to give when confirming connection
 */
export async function usersLoginRequestPassword(user: User): Promise<string> {
    throw new AppError("Password authentication method not implemented yet", 501);
}


/**
 * Generates a login confirmation for a user using password authentication.
 * @returns JWT for the authenticated user.
 */
export async function usersLoginConfirmPassword(): Promise<string> {
    throw new AppError("Password authentication confirmation not implemented yet", 501);
}