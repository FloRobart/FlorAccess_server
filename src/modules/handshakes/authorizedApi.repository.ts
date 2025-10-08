import { executeQuery } from '../../core/database/database';
import { AuthorizedApi } from './AuthorizedApi.schema';



export async function createAuthorizedApi(api: { api_name: string, api_url: string }, defaultApi: boolean = false): Promise<AuthorizedApi> {
    let query = "INSERT INTO authorizedapi (api_name, api_url) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT unique_api_name_url DO NOTHING RETURNING *;";
    if (defaultApi) {
        query = "INSERT INTO authorizedapi (api_name, api_url) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT unique_api_name_url DO UPDATE SET created_at = NOW() RETURNING *;";
    }

    let values = [api.api_name, api.api_url];

    return executeQuery({ text: query, values: values }).then((result) => {
        if (result === null) { throw new Error('Database query failed.'); }
        if (result.length === 0) { throw new Error('Failed to create authorized API.'); }

        return result[0] as AuthorizedApi;
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Retrieves an authorized API by its name.
 * @returns A promise that resolves to the authorized API object if found, otherwise throws an error.
 */
export async function getAllAuthorizedApi(): Promise<AuthorizedApi[]> {
    let query = "SELECT * FROM authorizedapi WHERE api_status=true;";

    return executeQuery({ text: query, values: [] }).then((rows) => {
        if (rows === null) { throw new Error("Database query failed."); }
        if (rows.length === 0) { throw new Error("No authorized API found."); }

        return rows as AuthorizedApi[];
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Retrieves an authorized API by its name and URL.
 * @param api_name The name of the API.
 * @param api_url The URL of the API.
 * @returns A promise that resolves to the authorized API object if found, otherwise throws an error.
 */
export async function getAuthorizedApiByNameUrl(api_name: string, api_url: string): Promise<AuthorizedApi | false> {
    if (!api_name || typeof api_name !== 'string') { throw new Error('Invalid API name.'); }
    if (!api_url || typeof api_url !== 'string') { throw new Error('Invalid API URL.'); }

    let query = "SELECT * FROM authorizedapi WHERE api_name=$1 AND api_url=$2 LIMIT 1;";
    let values = [api_name, api_url];

    return executeQuery({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error("Database query failed."); }
        if (rows.length === 0) { return false; }

        return rows[0] as AuthorizedApi;
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Retrieves an authorized API by its name.
 * @param api_name The name of the API.
 * @returns A promise that resolves to the authorized API object if found, otherwise throws an error.
 */
export async function getAuthorizedApiByName(api_name: string): Promise<AuthorizedApi | null> {
    if (!api_name || typeof api_name !== 'string') { throw new Error('Invalid API name.'); }

    let query = "SELECT * FROM authorizedapi WHERE api_name=$1 LIMIT 1;";
    let values = [api_name];

    return executeQuery({ text: query, values: values }).then((rows) => {
        if (rows === null) { throw new Error("Database query failed."); }
        if (rows.length === 0) { return null; }

        return rows[0] as AuthorizedApi;
    }).catch((err: Error) => {
        throw err;
    });
}

/**
 * Updates an authorized API in the database.
 * @param api The authorized API object to update.
 * @returns A promise that resolves to the updated authorized API object if successful, otherwise throws an error.
 */
export async function updateAuthorizedApi(api: AuthorizedApi): Promise<AuthorizedApi> {
    let query = "UPDATE authorizedapi SET api_name=$1, api_url=$2, api_privatetoken=$3, api_lastaccess=$4, api_status=$5, api_tokenvalidation=$6 WHERE api_id=$7 RETURNING *;";
    let values = [api.api_name, api.api_url, api.api_privatetoken || "", api.api_lastaccess || 0, api.api_status || false, api.api_tokenvalidation || false, api.api_id || 0];

    return executeQuery({ text: query, values: values }).then((result) => {
        if (result === null) { throw new Error('Database query failed.'); }
        if (result.length === 0) { throw new Error('Failed to update authorized API.'); }

        return result[0] as AuthorizedApi;
    }).catch((err: Error) => {
        throw err;
    });
}