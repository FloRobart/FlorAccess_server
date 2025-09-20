import pg from 'pg';
import * as logger from "../utils/logger";

const { Client } = pg;
let client: pg.Client;



/**
 * Connects the server to the database
 * @async
 * @param dburi The database URI
 * @example dburi = "postgresql://<user>:<password>@<host>:<port>/<db_name>"
 * @returns true if connected successfully, otherwise false
 */
export async function connectToDatabase(dburi: string|{host: string, user: string, password: string, port: number}): Promise<void> {
    try {
        client = new Client(dburi);
        await client.connect();

        client.on('error', (err) => {
            logger.error(err);
            logger.error("DATABASE ERROR")
        });

        client.on('end', () => {
            logger.success("DATABASE CONNECTION CLOSED")
        });
    } catch (err: any) {
        throw new Error(err);
    }
}


/**
 * Closes the database connection
 * @async
 * @returns boolean true if the connection was closed successfully, otherwise false
 */
export async function closeDatabaseConnection(): Promise<boolean> {
    try {
        return client.end().then(() => {
            return true;
        }).catch((err) => {
            logger.error(err);
            logger.error("FAILED CLOSING DATABASE CONNECTION");
            return false;
        });
    }
    catch (err) {
        logger.error(err);
        logger.error("FAILED CLOSING DATABASE CONNECTION");
        return false;
    }
}


/**
 * Executes a query on the database
 * @async
 * @param query The query to execute
 * @returns Array of rows returned by the query or an empty array if no rows are returned or an error occurs
 * @returns null if the query is not supported
 */
export async function executeQuery(query: Query): Promise<any[]|null> {
    try {
        const res = await client.query(query);
        return res.rows || [];
    } catch (err) {
        logger.error(err);
        logger.error("FAILED EXECUTING QUERY");
        return null;
    }
}



export type Query = { text: string; values: (string | number | boolean | null)[]; };