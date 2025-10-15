import { Database } from '../../core/database/database';
import { UserAuthMethodSchema } from '../auth_methods/auth_methods.schema';
import { UserAuthMethod, UserAuthMethodSafe } from '../auth_methods/auth_methods.type';
import { InsertUser, UpdateUser, User, UserSafe } from './users.types';
import * as logger from '../../core/utils/logger';



/**
 * Creates a new user in the database.
 * @param user The user object containing the email and pseudo of the user to create.
 * @param ip The IP address of the user (can be null).
 * @returns A promise that resolves to the created user object.
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

    logger.debug(`User created : ${JSON.stringify(insertedUser)}`);
    return insertedUser;
}

/**
 * Retrieves a user from the database by their ID.
 * @param userSafe The userSafe object containing the ID and other safe information of the user to retrieve.
 * @returns A promise that resolves to the user object if found, otherwise throws an error.
 */
export async function getUser(userSafe: UserSafe): Promise<User> {
    let query = "SELECT * FROM users WHERE id = $1 AND is_connected = true AND email = $2 AND pseudo = $3 AND date_trunc('second', last_login) = date_trunc('second', $4::timestamp) AND date_trunc('second', updated_at) = date_trunc('second', $5::timestamp) AND date_trunc('second', created_at) = date_trunc('second', $6::timestamp)";
    let values = [userSafe.id, userSafe.email, userSafe.pseudo, userSafe.last_login.toString(), userSafe.updated_at.toString(), userSafe.created_at.toString()];

    logger.debug(`Query : ${query}`);
    logger.debug(`Values : ${values}`);
    return Database.execute({ text: query, values: values }).then((rows) => {
        console.log(`Rows: ${JSON.stringify(rows)}`);
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('User not found.'); }


        return rows[0] as User;
    }).catch((error: Error) => {
        throw error;
    });
}


/**
 * Updates or a user in the database.
 * @param newUser The user object containing the updated user information.
 * @returns A promise that resolves to the updated user object.
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
 * @param email The email address of the user to delete.
 * @param token The authentication token of the user to delete.
 * @returns A promise that resolves to the deleted user object.
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
