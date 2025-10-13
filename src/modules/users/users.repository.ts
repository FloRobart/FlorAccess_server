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
export async function updateUser(updateUser: UpdateUser, id: number): Promise<User> {
    let query = "UPDATE users SET ";
    let setClauses: string[] = [];
    let values: (string | number | null)[] = [];
    values.push(id);

    for (const key in updateUser) {
        if (updateUser.hasOwnProperty(key)) {
            setClauses.push(`${key} = $${values.length + 1}`);
            values.push(updateUser[key as keyof UpdateUser]);
        }
    }

    query += setClauses.join(', ') + " WHERE id = $1 AND is_connected = true RETURNING *";

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this id.'); }

        return rows[0] as User;
    }).catch((error: Error) => {
        throw error;
    });
}










/**
 * Retrieves a user from the database by email and token.
 * @param email The email address of the user to retrieve.
 * @param token The authentication token of the user to retrieve.
 * @returns A promise that resolves to the user object if found, otherwise throws an error.
 */
export async function getUserByEmailToken(email: string, token: string): Promise<User> {
    if (!email || typeof email !== 'string') { throw new Error('Invalid email address.'); }
    if (!token || typeof token !== 'string') { throw new Error('Invalid token.'); }

    let query = "SELECT * FROM users WHERE users_email = $1 AND users_secret = $2";
    let values = [email, token];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this email and this token.'); }

        return rows[0] as User;
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Retrieves a user from the database by email.
 * @param email The email address of the user to retrieve.
 * @returns A promise that resolves to the user object if found, otherwise throws an error.
 */
export async function getUserByEmail(email: string): Promise<User> {
    if (!email || typeof email !== 'string') { throw new Error('Invalid email address.'); }

    const query = "SELECT * FROM users WHERE users_email = $1";
    const values = [email]

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this email.'); }

        return rows[0] as User;
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Retrieves a user's token from the database by email.
 * @param email The email address of the user whose token is to be retrieved.
 * @returns A promise that resolves to the user's token if found, otherwise throws an error.
 */
export async function getUserTokenByEmail(email: string): Promise<string> {
    if (!email || typeof email !== 'string') { throw new Error('Invalid email address.'); }

    let query = "SELECT users_secret FROM users WHERE users_email = $1";
    let values = [email]

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this email.'); }

        return rows[0].users_secret;
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Retrieves the count of users in the database by email.
 * @param email The email address to count users by.
 * @returns A promise that resolves to the count of users with the specified email.
 */
export async function getUserCountByEmail(email: string): Promise<number> {
    if (!email || typeof email !== 'string') { throw new Error('Invalid email address.'); }
    let query = "SELECT COUNT(*) FROM users WHERE users_email = $1";
    let values = [email];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this email.'); }

        return rows[0] as number;
    }).catch((err: Error) => {
        throw err;
    });
}


/**
 * Updates a user in the database by ID.
 * @param id The ID of the user to update.
 * @param updatedValues An object containing the values to update in the user record. (in [user_name, user_password, user_token, users_ip])
 * @returns A promise that resolves to the updated user object.
 */
export async function updateUserById(id: number, updatedValues: UpdatedValues): Promise<User> {
    if (!id || typeof id !== 'number') { throw new Error('Invalid id.'); }

    let query = "UPDATE users SET ";
    let setClauses: string[] = [];
    let values: (string | number | null)[] = [];
    values.push(id);

    let index = 2;
    for (const key in updatedValues) {
        if (updatedValues.hasOwnProperty(key)) {
            setClauses.push(`${key} = $${index}`);
            values.push(updatedValues[key as keyof UpdatedValues] || null);
            index++;
        }
    }
    if (setClauses.length === 0) { throw new Error('No values to update.'); }
    query += setClauses.join(', ') + " WHERE users_id = $1 RETURNING *";

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this id.'); }

        return rows[0] as User;
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Deletes a user from the database by email and token.
 * @param email The email address of the user to delete.
 * @param token The authentication token of the user to delete.
 * @returns A promise that resolves to the deleted user object.
 */
export async function deleteUserById(id: number): Promise<User> {
    if (!id || typeof id !== 'number') { throw new Error('Invalid id.'); }

    let query = "DELETE FROM users WHERE users_id = $1 RETURNING *";
    let values = [id];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this id.'); }

        return rows[0] as User;
    }).catch((err: Error) => {
        throw err;
    });
}



/**
 * Interface representing the values that can be updated in a user record.
 * @param users_email The email address of the user.
 * @param users_name The name of the user.
 * @param users_password The password of the user.
 * @param users_secret The authentication token of the user.
 */
interface UpdatedValues {
    users_email?: string,
    users_name?: string,
    users_password?: string,
    users_secret?: string,
    users_ip?: string,
}