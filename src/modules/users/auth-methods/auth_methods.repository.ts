import { Database } from "../../../core/database/database";
import { AuthMethod } from "./auth_methods.type";



/**
 * Gets a user by email.
 * 
 * This fonction is used by the login dispatcher.
 * @param id The id of the auth method to retrieve.
 * @returns The auth method object.
 * @throws Error if auth method retrieval fails or if the auth method is not found.
 */
export async function _getAuth_methodsById(id: number): Promise<AuthMethod> {
    const query = "SELECT * FROM auth_methods WHERE id = $1";
    const values = [id];

    return Database.execute({ text: query, values: values }).then((rows) => {
        if (rows.length === 0) { throw new Error('User not found.'); }

        return rows[0] as AuthMethod;
    }).catch((error: Error) => {
        throw error;
    });
}