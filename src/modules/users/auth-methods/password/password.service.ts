import { AppError } from "../../../../core/models/ErrorModel";
import { User } from "../../users.types";



/**
 * Generates a login request for a user using password authentication.
 * @param user The user object containing the information of the user.
 * @returns Token to give when confirming connection
 */
export async function usersLoginRequestPassword(user: User): Promise<string> {
    throw new AppError({ message: "Password authentication method not implemented yet", httpStatus: 501 });
}


/**
 * Generates a login confirmation for a user using password authentication.
 * @returns JWT for the authenticated user.
 */
export async function usersLoginConfirmPassword(): Promise<string> {
    throw new AppError({ message: "Password authentication confirmation not implemented yet", httpStatus: 501 });
}