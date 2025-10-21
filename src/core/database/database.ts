import pg from 'pg';
import * as logger from "../utils/logger";
import { ADatabase } from './database.schema';
import { AppError } from '../models/AppError.model';


/**
 * Database class to manage PostgreSQL connections and queries.
 * @extends ADatabase
 * @method connect - Connects to the database.
 * @method close - Closes the database connection.
 * @method static execute - Executes a query on the database.
 * @example
 * const db = new Database('postgresql://user:password@localhost:5432/mydb');
 * const rows = await Database.execute({ text: 'SELECT * FROM mytable', values: [] });
 */
export class Database extends ADatabase {
    constructor(private dburi: string | object) { super(); }

    /**
     * Connects the server to the database
     * @async
     * @param dburi The database URI
     * @example dburi = "postgresql://<user>:<password>@<host>:<port>/<db_name>"
     * @returns true if connected successfully, otherwise false
     */
    async connect(): Promise<void> {
        try {
            if (Database.client) return;
            Database.client = new pg.Client(this.dburi);
            await Database.client.connect();
            Database.client.on('error', (error: Error) => logger.error('DATABASE ERROR :', error));
            Database.client.on('end', () => logger.info('DATABASE CONNECTION CLOSED'));
        } catch (error) {
            throw new AppError('Database connection failed');
        }
    }

    /**
     * Closes the database connection
     * @async
     * @returns boolean true if the connection was closed successfully, otherwise false
     */
    async close(): Promise<void> {
        try {
            if (!Database.client) return;
            await Database.client.end();
            Database.client = null;
        } catch (error) {
            throw new AppError('Database disconnection failed');
        }
    }
}
