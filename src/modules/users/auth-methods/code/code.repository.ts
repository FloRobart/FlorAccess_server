import { Database } from "../../../../core/models/Database.model";
import { IPAddress, User } from "../../users.types";
import { AppError } from "../../../../core/models/AppError.model";



/**
 * Stores a new login code for a user, unless his logins are blocked or a code is still pending in its cooldown.
 *
 * The block and the cooldown are part of the query itself, so that requests sent at the same time
 * can not all store a code and reset the attempts counter one after the other.
 * The cooldown depends on the number of codes sent without a successful login: this number is part of the condition as well,
 * so that a request which counted another code in the meantime makes this one wait too.
 * @param user The user object containing the information of the user.
 * @param tokenHash The hashed token for the login request.
 * @param codeHash The hashed code for the login request.
 * @param blockTokenHash The hashed token of the block link sent with the code.
 * @param cooldownInMilliseconds The minimum time between two login codes for this user, computed from the number of codes he already received.
 * @returns True if the login code was stored, false if the user is blocked, still in cooldown or was not found.
 * @throws Error if the query fails.
 */
export async function userLoginRequest(user: User, tokenHash: string, codeHash: string, blockTokenHash: string, cooldownInMilliseconds: number): Promise<boolean> {
    try {
        const query = "UPDATE users SET token_hash = $6, secret_hash = $7, login_block_token_hash = $8, login_requested_at = NOW(), login_code_attempts = 0, login_requests_without_login = login_requests_without_login + 1 WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamptz) AND date_trunc('second', created_at) = date_trunc('second', $5::timestamptz) AND login_requests_without_login = $10 AND (login_blocked_until IS NULL OR login_blocked_until <= NOW()) AND (secret_hash IS NULL OR login_requested_at IS NULL OR login_requested_at <= NOW() - ($9::double precision * INTERVAL '1 millisecond')) RETURNING id";
        const values = [user.id, user.email, user.pseudo, user.last_logout_at.toISOString(), user.created_at.toISOString(), tokenHash, codeHash, blockTokenHash, cooldownInMilliseconds, user.login_requests_without_login];

        const rows = await Database.execute({ text: query, values: values });
        return rows.length > 0;
    } catch (error) {
        throw error;
    }
}


/**
 * Blocks the logins of a user who received too many login codes without a successful login, and cancels his pending code.
 *
 * The count of the codes starts again from zero: once the block is over, the codes are sent with the base cooldown again.
 * The block token is kept on purpose, so that the block link of the last email still works for the owner of the account.
 * The number of codes is part of the condition: a login which succeeded in the meantime is not followed by a block.
 * @param user The user to block, as he was read before the block.
 * @param blockDurationInMilliseconds The time during which the logins stay blocked.
 * @throws Error if the query fails.
 */
export async function blockLoginsAfterTooManyCodes(user: User, blockDurationInMilliseconds: number): Promise<void> {
    try {
        const query = "UPDATE users SET login_blocked_until = NOW() + ($3::double precision * INTERVAL '1 millisecond'), login_requests_without_login = 0, secret_hash = null, token_hash = null WHERE id = $1 AND login_requests_without_login = $2";
        const values = [user.id, user.login_requests_without_login, blockDurationInMilliseconds];

        await Database.execute<void>({ text: query, values: values });
    } catch (error) {
        throw error;
    }
}


/**
 * Uses one of the confirmations allowed on the current login code of a user.
 *
 * The attempt is counted by a single query before the code is checked,
 * so that confirmations sent in parallel can not exceed the limit.
 * The token hash ties the attempt to the code being checked : if a new code replaced it in the meantime, the attempt is refused.
 * @param userId The ID of the user who tries to confirm the login.
 * @param tokenHash The hashed token of the login code being checked.
 * @param maxAttempts The number of confirmations allowed on one login code.
 * @returns True if an attempt was still available, false if the limit is already reached or if the code was replaced.
 * @throws Error if the query fails.
 */
export async function consumeLoginCodeAttempt(userId: number, tokenHash: string, maxAttempts: number): Promise<boolean> {
    try {
        const query = "UPDATE users SET login_code_attempts = login_code_attempts + 1 WHERE id = $1 AND token_hash = $2 AND login_code_attempts < $3 RETURNING id";
        const values = [userId, tokenHash, maxAttempts];

        const rows = await Database.execute({ text: query, values: values });
        return rows.length > 0;
    } catch (error) {
        throw error;
    }
}


/**
 * Confirms a user's login by validating the JWT and IP address.
 *
 * The date of the login request and the block token are kept on purpose : the block link of the email
 * must still work after the login, and must be able to tell that the code was used.
 * The successful login starts again the count of the codes sent without login, which extends the cooldown and then blocks the logins.
 * A blocked account never logs in: blocking it already erases its pending code, the condition of the query makes sure of it.
 * @param userLoginConfirm The userLoginConfirm object containing the information of the user to confirm login.
 * @returns The updated user object.
 */
export async function userLoginConfirm(user: User, ip: IPAddress | null): Promise<User> {
    try {
        const query = "UPDATE users SET last_login = NOW(), is_connected = true, last_ip = $6, secret_hash = null, token_hash = null, login_code_attempts = 0, login_requests_without_login = 0, is_verified_email = true WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamptz) AND date_trunc('second', created_at) = date_trunc('second', $5::timestamptz) AND (login_blocked_until IS NULL OR login_blocked_until <= NOW()) RETURNING *";
        const values = [user.id, user.email, user.pseudo, user.last_logout_at.toISOString(), user.created_at.toISOString(), ip];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError("User not found", 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}
