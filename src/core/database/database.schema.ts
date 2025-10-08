import pg from "pg";



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
     * @returns null if the query is not supported
     */
    static async execute<T = any>(query: Query): Promise<T[]> {
        try {
            if (!this.client) throw new Error('Database not connected');
            const res = await this.client.query(query.text, query.values);
            return res.rows || [];
        } catch (error) {
            throw error;
        }
    }
}