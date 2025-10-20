import { Database } from "../../../../core/database/database";
import { User } from "../../users.types";
import { AppError } from "../../../../core/models/ErrorModel";


/**
 * Generates a login request for a user.
 * @param user The user object containing the information of the user.
 * @param tokenHash The hashed token for the login request.
 * @param codeHash The hashed code for the login request.
 * @throws Error if the login request generation fails or if the user is not found.
 */
export async function userLoginRequest(user: User, tokenHash: string, codeHash: string): Promise<void> {
    try {
        const query = "UPDATE users SET token_hash = $7, secret_hash = $8 WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', last_login) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp) RETURNING *";
        const values = [user.id, user.email, user.pseudo, user.last_login.toISOString(), user.updated_at.toISOString(), user.created_at.toISOString(), tokenHash, codeHash];

        const rows = await Database.execute({ text: query, values: values });
        if (rows.length === 0) { throw new AppError({ message: 'User not found.', httpStatus: 404 }); }
    } catch (error) {
        throw error;
    }
}