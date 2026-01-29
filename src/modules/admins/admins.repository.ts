import type { User, UserSafe } from '../users/users.types';

import { Database } from '../../core/models/Database.model';
import { AppError } from '../../core/models/AppError.model';



/**
 * Creates a new admin in the database.
 * @param admin The admin object containing the email and pseudo of the admin to create.
 * @param ip The IP address of the admin (can be null).
 * @returns The newly created admin object with sensitive information
 * @throws Error if admin creation fails.
 */
export async function isAdmin(userSafe: UserSafe): Promise<boolean> {
    try {
        let query = "SELECT is_connected, is_admin FROM users WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', created_at) = date_trunc('second', $4::timestamp)";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.created_at.toString()];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length <= 0) { throw new AppError('User not found', 404); }
        if (!rows[0].is_connected) { throw new AppError('User is not connected', 401); }

        return rows[0].is_admin;
    } catch (error) {
        throw error;
    }
}

/**
 * Retrieves information about all users.
 * @returns List of User objects.
 * @throws Error if user retrieval fails.
 */
export async function selectUsers(): Promise<User[]> {
    try {
        let query = "SELECT * FROM users";
        const rows = await Database.execute<User>({ text: query, values: [] });
        return rows;
    } catch (error) {
        throw error;
    }
}