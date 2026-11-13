import type { User, UserSafe } from '../users/users.types';
import type { AuthorizedQueryParams, UserAdminUpdate } from './admins.types';

import { Database } from '../../core/models/Database.model';
import { AppError } from '../../core/models/AppError.model';
import { assertSessionIsOpen } from '../users/users.repository';



/**
 * Checks if the user of a JWT is an administrator, after checking that the session of this JWT is still open.
 * @param userSafe The user decoded from the JWT.
 * @returns True if the user is an administrator.
 * @throws AppError 404 if the user is not found, 401 if the session of the JWT is closed.
 */
export async function isAdmin(userSafe: UserSafe): Promise<boolean> {
    try {
        let query = "SELECT is_connected, is_verified_email, is_admin, last_logout_at FROM users WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', created_at) = date_trunc('second', $4::timestamptz)";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.created_at.toString()];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length <= 0) { throw new AppError('User not found', 404); }
        assertSessionIsOpen(userSafe, rows[0]);

        return rows[0].is_admin;
    } catch (error) {
        throw error;
    }
}


/*========*/
/* SELECT */
/*========*/
/**
 * Retrieves information about all users.
 * @returns List of User objects.
 * @throws Error if user retrieval fails.
 */
export async function selectUsers(queryParams: AuthorizedQueryParams): Promise<User[]> {
    try {
        let query = "SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2";
        const rows = await Database.execute<User>({ text: query, values: [queryParams.limit, queryParams.offset] });
        return rows;
    } catch (error) {
        throw error;
    }
}

/**
 * Counts the total number of users.
 * @returns Total number of users or error response
 */
export async function countUsers(): Promise<number> {
    try {
        let query = "SELECT COUNT(*) FROM users";
        const rows = await Database.execute<{ count: string }>({ text: query, values: [] });
        return parseInt(rows[0].count, 10);
    } catch (error) {
        throw error;
    }
};


/*========*/
/* UPDATE */
/*========*/
/**
 * Updates user in the database.
 * @param updateUser The user object containing the updated user information.
 * @param userAdmin The userAdmin object containing the current information of the user to update.
 * @returns The updated user object with sensitive information.
 * @throws Error if user update fails or if the user is not found.
 */
export async function updateUser(updateUser: UserAdminUpdate, userAdmin: User): Promise<User> {
    try {
        let query = "UPDATE users SET ";
        let setClauses: string[] = [];
        let values: (string | number | boolean | null)[] = [];
        values.push(userAdmin.id, userAdmin.is_connected, userAdmin.email, userAdmin.pseudo, userAdmin.last_logout_at.toISOString(), userAdmin.created_at.toISOString());
    
        for (const key in updateUser) {
            if (updateUser.hasOwnProperty(key)) {
                const value = updateUser[key as keyof UserAdminUpdate];
                if (value === undefined) continue;

                setClauses.push(`${key} = $${values.length + 1}`);
                values.push(value);
            }
        }
    
        query += setClauses.join(', ') + " WHERE id = $1 AND is_connected = $2 AND email = $3 AND pseudo = $4 AND date_trunc('second', last_logout_at) = date_trunc('second', $5::timestamptz) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamptz) RETURNING *";

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Unblocks the logins of a user, whether they were blocked by his block link or after too many login codes.
 *
 * The count of the codes sent without a successful login starts again from zero, like after a block that ends by itself.
 * The token of the block link is kept: the owner of the account can still block it again from his last email.
 * @param userId The ID of the user to unblock.
 * @returns The unblocked user object with sensitive information.
 * @throws AppError 404 if no user has this ID.
 */
export async function unblockUserLogin(userId: number): Promise<User> {
    try {
        const query = "UPDATE users SET login_blocked_until = NULL, login_requests_without_login = 0 WHERE id = $1 RETURNING *";
        const rows = await Database.execute<User>({ text: query, values: [userId] });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/*========*/
/* DELETE */
/*========*/
/**
 * Deletes a user.
 * @param userId The ID of the user to delete
 */
export async function deleteUser(userId: number): Promise<void> {
    try {
        let query = "DELETE FROM users WHERE id = $1 RETURNING *";
        const rows = await Database.execute<User>({ text: query, values: [userId] });
        if (rows.length === 0) { throw new AppError('User not found', 404); }
    } catch (error) {
        throw error;
    }
}
