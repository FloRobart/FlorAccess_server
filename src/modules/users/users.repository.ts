import { Database } from '../../core/models/Database.model';
import { InsertUser, IPAddress, UpdateUser, User, UserSafe } from './users.types';
import AppConfig from '../../config/AppConfig';
import { AppError } from '../../core/models/AppError.model';



/**
 * Creates a new user in the database.
 * @param user The user object containing the email and pseudo of the user to create.
 * @param ip The IP address of the user (can be null).
 * @returns The newly created user object with sensitive information
 * @throws Error if user creation fails.
 */
export async function insertUser(user: InsertUser, ip: IPAddress | null, email_verify_token_hash: string): Promise<User> {
    try {
        const query = "INSERT INTO users (email, pseudo, auth_methods_id, last_ip, email_verify_token_hash) VALUES ($1, $2, (SELECT id FROM auth_methods WHERE immuable_method_name = $3), $4, $5) ON CONFLICT DO NOTHING RETURNING *";
        const values: (string | number | null)[] = [user.email, user.pseudo, AppConfig.default_auth_method, ip, email_verify_token_hash];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError("Failed to create user", 500); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Retrieves a user from the database by their ID.
 * @param userSafe The userSafe object containing the information of the user to retrieve.
 * @returns The user object with sensitive information.
 * @throws Error if user retrieval fails or if the user is not found.
 */
export async function getUser(userSafe: UserSafe): Promise<User> {
    try {
        let query = "SELECT * FROM users WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp)";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString()];

        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
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
        values.push(userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString());
    
        for (const key in updateUser) {
            if (updateUser.hasOwnProperty(key)) {
                setClauses.push(`${key} = $${values.length + 1}`);
                values.push(updateUser[key as keyof UpdateUser]);
            }
        }
    
        query += setClauses.join(', ') + " WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp) RETURNING *";

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
        let query = "DELETE FROM users WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp) RETURNING *";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString()];
        
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
        let query = "UPDATE users SET is_connected = false, last_logout_at = NOW() WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', last_logout_at) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp) RETURNING *";
        let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_logout_at.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString()];
        
        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}


/**
 * Verifies a user's email.
 * @param userId The ID of the user to verify email.
 * @throws Error if query fails.
 */
export async function UserEmailVerify(userId: number): Promise<void> {
    try {
        const query = "UPDATE users SET is_verified_email = true, email_verify_token_hash = null WHERE id = $1";
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
 * @param email The email of the user to retrieve.
 */
export async function _getUserByEmail(email: string): Promise<User> {
    try {
        const query = "SELECT * FROM users WHERE email = $1";
        const values = [email];
        
        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('User not found', 404); }

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