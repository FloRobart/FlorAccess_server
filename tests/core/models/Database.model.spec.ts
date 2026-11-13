import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Database } from "../../../src/core/models/Database.model";
import logger from "../../../src/core/utils/logger";



/* No database is really used : the pool of connections of PostgreSQL is replaced */
const { fakePool, Pool } = vi.hoisted(() => {
    const fakePool = {
        query: vi.fn(),
        on: vi.fn(),
        end: vi.fn(),
    };

    /* A function, and not an arrow function, so that the mock can be called with "new" */
    return { fakePool, Pool: vi.fn(function () { return fakePool; }) };
});

vi.mock("pg", () => ({
    default: { Pool: Pool },
}));

vi.mock("../../../src/core/utils/logger", () => ({
    default: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));



/**
 * Database tests
 */
describe('Database', () => {
    beforeEach(() => {
        fakePool.query.mockResolvedValue({ rows: [] });
        fakePool.end.mockResolvedValue(undefined);
    });

    afterEach(async () => {
        /* The pool is shared by the whole application : each test starts without connection */
        fakePool.end.mockResolvedValue(undefined);
        await new Database(DatabaseUri).close();
    });


    /*============*/
    /* Connection */
    /*============*/
    describe('Connection', () => {
        it('Creates a pool of connections and checks that the database answers', async () => {
            await new Database(DatabaseUri).connect();

            expect(Pool).toHaveBeenCalledWith({ connectionString: DatabaseUri });
            expect(fakePool.query).toHaveBeenCalledWith('SELECT 1');
        });

        it('Keeps the same pool when it is already connected', async () => {
            await new Database(DatabaseUri).connect();
            await new Database(DatabaseUri).connect();

            expect(Pool).toHaveBeenCalledTimes(1);
        });

        it('Logs the errors of the idle connections instead of stopping the server', async () => {
            await new Database(DatabaseUri).connect();
            const [eventName, onPoolError] = fakePool.on.mock.calls[0];
            const connectionError = new Error("Connection terminated unexpectedly");

            onPoolError(connectionError);

            expect(eventName).toBe('error');
            expect(logger.error).toHaveBeenCalledWith(expect.any(String), connectionError);
        });

        it('Fails when the database does not answer', async () => {
            fakePool.query.mockRejectedValue(new Error("ECONNREFUSED"));

            await expect(new Database(DatabaseUri).connect()).rejects.toMatchObject({ message: 'Database connection failed' });
        });
    });


    /*===========*/
    /* Execution */
    /*===========*/
    describe('Execution of a query', () => {
        it('Fails when the database is not connected', async () => {
            await expect(Database.execute(Query)).rejects.toMatchObject({ message: 'Database not connected', httpStatus: 500 });
        });

        it('Returns the rows of the query', async () => {
            await new Database(DatabaseUri).connect();
            fakePool.query.mockResolvedValue({ rows: [{ id: 1 }] });

            await expect(Database.execute(Query)).resolves.toStrictEqual([{ id: 1 }]);
            expect(fakePool.query).toHaveBeenLastCalledWith(Query.text, Query.values);
        });

        it('Returns an empty list when the query gives no rows', async () => {
            await new Database(DatabaseUri).connect();
            fakePool.query.mockResolvedValue({ rows: undefined });

            await expect(Database.execute(Query)).resolves.toStrictEqual([]);
        });

        it('Fails when the result of the query has no rows', async () => {
            await new Database(DatabaseUri).connect();
            fakePool.query.mockResolvedValue({ rows: null });

            await expect(Database.execute(Query)).rejects.toMatchObject({ message: 'Database query failed' });
        });

        it('Hides the error of the database behind a generic error', async () => {
            await new Database(DatabaseUri).connect();
            fakePool.query.mockRejectedValue(new Error("syntax error at or near \"SELEC\""));

            await expect(Database.execute(Query)).rejects.toMatchObject({ message: 'Database unknown error', httpStatus: 500 });
        });
    });


    /*=======*/
    /* Close */
    /*=======*/
    describe('Close', () => {
        it('Does nothing when the database is not connected', async () => {
            await new Database(DatabaseUri).close();

            expect(fakePool.end).not.toHaveBeenCalled();
        });

        it('Closes the pool, after which the queries are refused', async () => {
            const database = new Database(DatabaseUri);
            await database.connect();

            await database.close();

            expect(fakePool.end).toHaveBeenCalledTimes(1);
            await expect(Database.execute(Query)).rejects.toMatchObject({ message: 'Database not connected' });
        });

        it('Fails when the pool can not be closed', async () => {
            const database = new Database(DatabaseUri);
            await database.connect();
            fakePool.end.mockRejectedValue(new Error("Pool already closed"));

            await expect(database.close()).rejects.toMatchObject({ message: 'Database disconnection failed' });
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const DatabaseUri: string = "postgresql://user:password@localhost:5432/floraccess";

const Query = {
    text: "SELECT * FROM users WHERE id = $1",
    values: [1],
};
