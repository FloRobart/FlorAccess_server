import { Database } from '../../core/database/database';
import { UserAuthMethod } from '../auth_methods/auth_methods.type';
import { InsertUser, LoginUser, UpdateUser, User, UserSafe } from './users.types';
import * as logger from '../../core/utils/logger';



/**
 * Creates a new user in the database.
 * @param user The user object containing the email and pseudo of the user to create.
 * @param ip The IP address of the user (can be null).
 * @returns The newly created user object with sensitive information
 * @throws Error if user creation fails.
 */
export async function insertUser(user: InsertUser, ip: string | null): Promise<User> {
    let insertedUser: User;
    const DEFAULT_AUTH_METHOD = 'EMAIL_CODE';
    
    /* Create the user */
    try {
        const query = "INSERT INTO users (email, pseudo, last_ip) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *";
        const values: (string | number | null)[] = [user.email, user.pseudo, ip];
        
        const rows = await Database.execute<User>({ text: query, values: values });
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('Failed to create user.'); }

        insertedUser = rows[0];
    } catch (error) {
        throw error;
    }

    /* Assign default auth method to the user */
    try {
        const query = "INSERT INTO user_auth_methods (user_id, auth_method_id) VALUES ($1, (SELECT id FROM auth_methods WHERE immuable_method_name = $2)) ON CONFLICT DO NOTHING RETURNING *";
        const values = [insertedUser.id, DEFAULT_AUTH_METHOD];
        
        const rows = await Database.execute<UserAuthMethod>({ text: query, values: values });
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No auth method assigned.'); }
        
        insertedUser.auth_methods = rows;
    } catch (error) {
        throw error;
    }

    return insertedUser;
}


/**
 * Retrieves a user from the database by their ID.
 * @param userSafe The userSafe object containing the information of the user to retrieve.
 * @returns The user object with sensitive information.
 * @throws Error if user retrieval fails or if the user is not found.
 */
export async function getUser(userSafe: UserSafe): Promise<User> {
    let query = "SELECT * FROM users WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_login) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp)";
    let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_login.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString()];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('User not found.'); }


        return rows[0] as User;
    }).catch((error: Error) => {
        throw error;
    });
}


/**
 * Updates user in the database.
 * @param updateUser The user object containing the updated user information.
 * @param userSafe The userSafe object containing the current information of the user to update.
 * @returns The updated user object with sensitive information.
 * @throws Error if user update fails or if the user is not found.
 */
export async function updateUser(updateUser: UpdateUser, userSafe: UserSafe): Promise<User> {
    let query = "UPDATE users SET ";
    let setClauses: string[] = [];
    let values: (string | number | null)[] = [];
    values.push(userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_login.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString());

    for (const key in updateUser) {
        if (updateUser.hasOwnProperty(key)) {
            setClauses.push(`${key} = $${values.length + 1}`);
            values.push(updateUser[key as keyof UpdateUser]);
        }
    }

    query += setClauses.join(', ') + " WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_login) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp) RETURNING *";

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this id.'); }

        return rows[0] as User;
    }).catch((error: Error) => {
        throw error;
    });
}


/**
 * Deletes a user from the database by email and token.
 * @param userSafe The userSafe object containing the information of the user to delete.
 * @returns The deleted user object with sensitive information.
 * @throws Error if user deletion fails or if the user is not found.
 */
export async function deleteUser(userSafe: UserSafe): Promise<User> {
    let query = "DELETE FROM users WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_login) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp) RETURNING *";
    let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_login.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString()];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this id.'); }

        return rows[0] as User;
    }).catch((err: Error) => {
        throw err;
    });
}


/**
 * Logs in a user.
 * @param loginUser The loginUser object containing the information of the user to log in.
 * @returns The user object if login is successful.
 * @throws Error if login fails or if the information is invalid.
 */
export async function loginUser(loginUser: LoginUser): Promise<User> {
    let query = "UPDATE users SET is_connected = true, last_login = NOW() WHERE email = $1 RETURNING *";
    let values = [loginUser.email];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this email.'); }

        return rows[0] as User;
    }).catch((err: Error) => {
        throw err;
    });
}


/**
 * Logs out a user
 * @param userSafe The userSafe object containing the information of the user to log out.
 * @returns True if the user was logged out successfully.
 * @throws Error if logout fails.
 */
export async function logoutUser(userSafe: UserSafe): Promise<boolean> {
    let query = "UPDATE users SET is_connected = false WHERE id = $1 AND email = $2 AND pseudo = $3 AND date_trunc('second', last_login) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp)";
    let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_login.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString()];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this id.'); }

        return true;
    }).catch((err: Error) => {
        throw err;
    });
}