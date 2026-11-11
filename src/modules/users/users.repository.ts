import type { InsertUser, IPAddress, UpdateUser, User, UserSafe } from './users.types';

import { Database } from '../../core/models/Database.model';
import AppConfig from '../../config/AppConfig';
import { AppError } from '../../core/models/AppError.model';
import { isJwtFromClosedSession } from '../../core/utils/jwt';



export const UNVERIFIED_EMAIL_MESSAGE = 'Email address not verified, please log in with a code';



/**
 * Creates a new user in the database, unless his email address is already used.
 *
 * The conflict is handled by the query itself, so that two registrations sent at the same time with the same address
 * can not both create an account.
 * @param user The user object containing the email and pseudo of the user to create.
 * @param ip The IP address of the user (can be null).
 * @param email_verify_token_hash The hash of the token which verifies the email address.
 * @returns The newly created user object with sensitive information, or null if the email address is already used
 * @throws Error if the query fails.
 */
export async function insertUser(user: InsertUser, ip: IPAddress | null, email_verify_token_hash: string): Promise<User | null> {
    try {
        const query = "INSERT INTO users (email, pseudo, auth_methods_id, last_ip, email_verify_token_hash) VALUES ($1, $2, (SELECT id FROM auth_methods WHERE immuable_method_name = $3), $4, $5) ON CONFLICT DO NOTHING RETURNING *";
        const values: (string | number | null)[] = [user.email, user.pseudo, AppConfig.default_auth_method, ip, email_verify_token_hash];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { return null; }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Retrieves the user of a JWT from the database, after checking that the session of this JWT is still open.
 * @param userSafe The userSafe object containing the information of the user to retrieve.
 * @returns The user object with sensitive information.
 * @throws AppError 404 if the user is not found, 401 if the session of the JWT is closed.
 */
export async function getUser(userSafe: UserSafe): Promise<User> {
    try {
        let query = "SELECT * FROM users WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', created_at) = date_trunc('second', $4::timestamptz)";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.created_at.toString()];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length <= 0) { throw new AppError('User not found', 404); }
        assertSessionIsOpen(userSafe, rows[0]);

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Checks that the session of a JWT is still open, from the current state of its user in the database.
 * @param jwtUser The user decoded from the JWT.
 * @param storedUser The current state of the same user in the database.
 * @throws AppError 401 if the user is logged out, if the JWT was issued before his last logout, or if his email address is not proven.
 */
export function assertSessionIsOpen(jwtUser: UserSafe, storedUser: Pick<User, 'is_connected' | 'is_verified_email' | 'last_logout_at'>): void {
    if (!storedUser.is_connected) { throw new AppError('User is not connected', 401); }

    /* Without this check, the JWT issued before a logout work again as soon as the user logs back in */
    if (isJwtFromClosedSession(jwtUser, storedUser.last_logout_at)) { throw new AppError('Session closed, please log in again', 401); }

    /* The former registration gave a JWT before the address was proven, to anyone who typed it: such a JWT must not open the account */
    if (!storedUser.is_verified_email) { throw new AppError(UNVERIFIED_EMAIL_MESSAGE, 401); }
}


/**
 * Updates user in the database.
 * @param updateUser The user object containing the updated user information.
 * @param userSafe The userSafe object containing the current information of the user to update.
 * @returns The updated user object with sensitive information.
 * @throws Error if user update fails or if the user is not found.
 */
export async function updateUser(updateUser: UpdateUser, userSafe: UserSafe): Promise<User> {
    try {
        let query = "UPDATE users SET ";
        let setClauses: string[] = [];
        let values: (string | number | null)[] = [];
        values.push(userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.created_at.toString());
    
        for (const key in updateUser) {
            if (updateUser.hasOwnProperty(key)) {
                setClauses.push(`${key} = $${values.length + 1}`);
                values.push(updateUser[key as keyof UpdateUser]);
            }
        }
    
        query += setClauses.join(', ') + " WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamptz) AND date_trunc('second', created_at) = date_trunc('second', $5::timestamptz) RETURNING *";

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Deletes a user from the database by email and token.
 * @param userSafe The userSafe object containing the information of the user to delete.
 * @returns The deleted user object with sensitive information.
 * @throws Error if user deletion fails or if the user is not found.
 */
export async function deleteUser(userSafe: UserSafe): Promise<User> {
    try {
        let query = "DELETE FROM users WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamptz) AND date_trunc('second', created_at) = date_trunc('second', $5::timestamptz) RETURNING *";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.created_at.toString()];
        
        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Logs out a user
 * @param userSafe The userSafe object containing the information of the user to log out.
 * @returns True if the user was logged out successfully.
 * @throws Error if logout fails.
 */
export async function logoutUser(userSafe: UserSafe): Promise<User> {
    try {
        let query = "UPDATE users SET is_connected = false, last_logout_at = NOW() WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamptz) AND date_trunc('second', created_at) = date_trunc('second', $5::timestamptz) RETURNING *";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.created_at.toString()];
        
        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Blocks the logins of a user for a given time and cancels his pending login code.
 *
 * The block token hash is part of the condition, so that a block link can only be used once.
 * The count of the codes sent without a successful login starts again from zero, like after the block made by the API
 * after too many codes: otherwise, a user who blocks his logins after his 10th code would be blocked again when this block ends.
 * @param userId The ID of the user to block.
 * @param blockTokenHash The hashed token of the block link which was checked.
 * @param blockDurationInMilliseconds The time during which the logins stay blocked.
 * @param mustLogoutFromAllDevices True to also close the sessions of the user on all his devices.
 * @returns True if the logins were blocked, false if the block link was already used or replaced.
 * @throws Error if the query fails.
 */
export async function blockUserLogin(userId: number, blockTokenHash: string, blockDurationInMilliseconds: number, mustLogoutFromAllDevices: boolean): Promise<boolean> {
    try {
        const query = "UPDATE users SET login_blocked_until = NOW() + ($3::double precision * INTERVAL '1 millisecond'), login_requests_without_login = 0, login_block_token_hash = null, secret_hash = null, token_hash = null, is_connected = CASE WHEN $4::boolean THEN false ELSE is_connected END, last_logout_at = CASE WHEN $4::boolean THEN NOW() ELSE last_logout_at END WHERE id = $1 AND login_block_token_hash = $2 RETURNING id";
        const values = [userId, blockTokenHash, blockDurationInMilliseconds, mustLogoutFromAllDevices];

        const rows = await Database.execute({ text: query, values: values });
        return rows.length > 0;
    } catch (error) {
        throw error;
    }
}


/**
 * Updates a user's email verification token hash.
 * @param userId The ID of the user to update.
 * @param email_verify_token_hash The new email verification token hash.
 * @throws Error if query fails.
 */
export async function updateUserEmailVerifyTokenHash(userId: number, email_verify_token_hash: string | null): Promise<void> {
    try {
        const query = "UPDATE users SET email_verify_token_hash = $1 WHERE id = $2";
        const values = [email_verify_token_hash, userId];

        await Database.execute<void>({ text: query, values: values });
    } catch (error) {
        throw error;
    }
}


/**
 * Verifies a user's email, and closes the sessions opened before this verification.
 *
 * Anyone can register an account with an email address he does not own and get a JWT for it.
 * The sessions opened before the address was proven are closed, so that only its real owner keeps an access.
 * @param userId The ID of the user to verify email.
 * @throws Error if query fails.
 */
export async function UserEmailVerify(userId: number): Promise<void> {
    try {
        const query = "UPDATE users SET is_verified_email = true, email_verify_token_hash = null, is_connected = false, last_logout_at = NOW() WHERE id = $1";
        const values = [userId];

        await Database.execute<void>({ text: query, values: values });
    } catch (error) {
        throw error;
    }
}


/**
 * Gets a user by email.
 * 
 * This fonction is used by the login dispatcher.
 * @param email The email of the user to retrieve or null if the user doesn't exist.
 */
export async function _getUserByEmail(email: string): Promise<User | null> {
    try {
        const query = "SELECT * FROM users WHERE email = $1";
        const values = [email];
        
        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { return null; }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Gets a user by email.
 * 
 * This fonction is dangerous and should be used carefully.
 * @param email The email of the user to retrieve.
 */
export async function _getUserById(id: number): Promise<User> {
    try {
        const query = "SELECT * FROM users WHERE id = $1";
        const values = [id];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Updates a user whose email address changes, marks the new address as not verified and closes all his sessions.
 *
 * All these changes are made by the same query, so that a new address can never stay marked as verified,
 * and no session can keep running with an address which is not proven : the user logs in again with a code sent to the new address.
 * @param updateUser The user object containing the updated user information.
 * @param userSafe The userSafe object containing the current information of the user to update.
 * @param email_verify_token_hash The hash of the token sent to the new address to verify it.
 * @returns The updated user object with sensitive information.
 * @throws Error if user update fails or if the user is not found.
 */
export async function updateUserWithUnverifiedEmail(updateUser: UpdateUser, userSafe: UserSafe, email_verify_token_hash: string): Promise<User> {
    try {
        const query = "UPDATE users SET email = $6, pseudo = $7, is_verified_email = false, email_verify_token_hash = $8, is_connected = false, last_logout_at = NOW() WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamptz) AND date_trunc('second', created_at) = date_trunc('second', $5::timestamptz) RETURNING *";
        const values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.created_at.toString(), updateUser.email, updateUser.pseudo, email_verify_token_hash];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Invalidates every JWT already issued for a user, without logging him out.
 *
 * A JWT carries the date of the last logout of its user : changing this date makes the JWT issued before stop matching the user.
 * @param userId The ID of the user whose JWT are invalidated.
 * @returns The updated user object, to use to generate a new JWT.
 * @throws Error if the query fails or if the user is not found.
 */
export async function invalidateUserSessions(userId: number): Promise<User> {
    try {
        const query = "UPDATE users SET last_logout_at = NOW() WHERE id = $1 RETURNING *";
        const values = [userId];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Deletes the users whose email address was never proven, and who were created more than a number of months ago.
 * @param retentionInMonths Number of months during which an account keeps an email address which was never proven.
 * @returns The number of deleted users.
 * @throws Error if the query fails.
 */
export async function deleteUnverifiedUsersCreatedBefore(retentionInMonths: number): Promise<number> {
    const query = "DELETE FROM users WHERE is_verified_email = false AND created_at < NOW() - make_interval(months => $1) RETURNING id";
    const values = [retentionInMonths];

    const rows = await Database.execute<Pick<User, 'id'>>({ text: query, values: values });

    return rows.length;
}
