import { executeQuery } from '../database/database';
import { User } from '../models/UsersModel';



/**
 * Creates a new user in the database.
 * @param email The email address of the user to create.
 * @param token The authentication token for the user.
 * @param name Optional name of the user.
 * @returns A promise that resolves to the created user object.
 */
export async function createUser(email: string, token: string|null, name: string|undefined): Promise<User> {
    if (!email || typeof email !== 'string') { throw new Error('Invalid email address.'); }

    let query = "INSERT INTO users (users_email, users_secret, users_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *";
    let values = [email, token, name || null];

    return executeQuery({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('Failed to create user.'); }

        return rows[0] as User;
    }).catch((err: Error) => {
        throw err;
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

    return executeQuery({ text: query, values: values }).then((rows) => {
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

    return executeQuery({ text: query, values: values }).then((rows) => {
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

    return executeQuery({ text: query, values: values }).then((rows) => {
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

    return executeQuery({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('No user with this email.'); }

        return rows[0] as number;
    }).catch((err: Error) => {
        throw err;
    });
}


/**
 * Updates or a user in the database.
 * @param user The user object containing the updated user information.
 * @returns A promise that resolves to the updated user object.
 */
export async function updateUser(user: User): Promise<User> {
    if (!user || !user.users_email || typeof user.users_email !== 'string') { throw new Error('Invalid user object.'); }

    // Utilisation d'UPSERT pour créer ou mettre à jour l'utilisateur
    const query = `INSERT INTO users (users_email, users_name, users_authmethod, users_password, users_secret, users_ip)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (users_email)
        DO UPDATE SET
            users_name = EXCLUDED.users_name,
            users_authmethod = EXCLUDED.users_authmethod,
            users_password = EXCLUDED.users_password,
            users_secret = EXCLUDED.users_secret,
            users_ip = EXCLUDED.users_ip
        RETURNING *`;
    const values = [user.users_email, user.users_name, user.users_authmethod, user.users_password, user.users_secret, user.users_ip];

    return executeQuery({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error('Database query failed.'); }
        if (rows.length === 0) { throw new Error('Failed to create or update user.'); }

        return rows[0] as User;
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

    return executeQuery({ text: query, values: values }).then((rows) => {
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

    return executeQuery({ text: query, values: values }).then((rows) => {
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
    users_secret?: string
}