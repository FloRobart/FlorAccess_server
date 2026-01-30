import pg from 'pg';
import logger from "../utils/logger";
import { AppError } from './AppError.model';



/*=========================*/
/* Abstract Database Model */
/*=========================*/
/**
 * Database schema defining the IDatabase interface and Query type.
 */
export interface IDatabase {
    connect(): Promise<void>;
    close(): Promise<void>;
}

/**
 * Query type representing a database query with text and optional values.
 */
export type Query = {
    text: string;
    values: (string | number | boolean | null)[] | undefined;
};

/**
 * Abstract Database class implementing the IDatabase interface.
 * This class provides methods to connect to, close, and execute queries on the database.
 * @abstract
 * @implements {IDatabase}
 * @method connect - Connects to the database.
 * @method close - Closes the database connection.
 * @method static execute - Executes a query on the database.
 */
export abstract class ADatabase implements IDatabase {
    protected static client: pg.Client | null = null;

    abstract connect(): Promise<void>;
    abstract close(): Promise<void>;

    /**
     * Executes a query on the database
     * @async
     * @param query The query to execute
     * @returns Array of rows returned by the query or an empty array if no rows are returned or an error occurs
     * @throws AppError if the database is not connected or if the query fails
     */
    static async execute<T = any>(query: Query): Promise<T[]> {
        try {
            if (!this.client) throw new AppError('Database not connected');
            const res = await this.client.query(query.text, query.values);
            if (res.rows === null) { throw new AppError('Database query failed'); }

            return res.rows || [];
        } catch (error) {
            throw (error instanceof AppError) ? error : new AppError("Database unknown error");
        }
    }
}



/*================*/
/* Database Model */
/*================*/
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