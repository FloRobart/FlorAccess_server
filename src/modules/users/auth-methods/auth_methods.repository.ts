import { AppError } from "../../../core/models/AppError.model";
import { Database } from "../../../core/models/Database.model";
import { AuthMethod } from "./auth_methods.types";



/**
 * Gets a user by email.
 * 
 * This fonction is used by the login dispatcher.
 * @param id The id of the auth method to retrieve.
 * @returns The auth method object.
 * @throws Error if auth method retrieval fails or if the auth method is not found.
 */
export async function _getAuth_methodsById(id: number): Promise<AuthMethod> {
    try {
        const query = "SELECT * FROM auth_methods WHERE id = $1";
        const values = [id];

        const rows = await Database.execute<AuthMethod>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError('Auth method not found', 404); }

        return rows[0];
    } catch (error) {
        throw error;
    }
}