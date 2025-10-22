import { Database } from "../../../../core/models/Database.model";
import { IPAddress, User } from "../../users.types";
import { AppError } from "../../../../core/models/AppError.model";



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
        if (rows.length === 0) { throw new AppError("User not found", 404); }
    } catch (error) {
        throw error;
    }
}


/**
 * Confirms a user's login by validating the JWT and IP address.
 * @param userLoginConfirm The userLoginConfirm object containing the information of the user to confirm login.
 * @returns The updated user object.
 */
export async function userLoginConfirm(user: User, ip: IPAddress | null): Promise<User> {
    try {
        const query = "UPDATE users SET last_login = NOW(), is_connected = true, last_ip = $7, secret_hash = null, token_hash = null WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', last_login) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp) RETURNING *";
        const values = [user.id, user.email, user.pseudo, user.last_login.toISOString(), user.updated_at.toISOString(), user.created_at.toISOString(), ip];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError("User not found", 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}