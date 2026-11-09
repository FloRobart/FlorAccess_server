import { describe, it, expect, vi, beforeEach } from "vitest";
import * as CodeRepository from "../../../../../src/modules/users/auth-methods/code/code.repository";
import { Database } from "../../../../../src/core/models/Database.model";
import { buildUser } from "../../users.fixtures";



/* The database is replaced, only the queries and the handling of their result are tested */
vi.mock("../../../../../src/core/models/Database.model", () => ({
    Database: { execute: vi.fn() },
}));



/**
 * Login code repository tests
 */
describe('Login code repository', () => {
    beforeEach(() => {
        vi.mocked(Database.execute).mockResolvedValue([{ id: User.id }]);
    });


    /*===============*/
    /* Login request */
    /*===============*/
    describe('Storage of a login code', () => {
        it('Stores the hashes of the login code for the user and his cooldown', async () => {
            await expect(CodeRepository.userLoginRequest(User, "token-hash", "code-hash", "block-token-hash", 60000)).resolves.toBe(true);

            expect(getLastQueryValues()).toStrictEqual([
                User.id, User.email, User.pseudo, User.last_logout_at.toISOString(), User.created_at.toISOString(),
                "token-hash", "code-hash", "block-token-hash", 60000,
            ]);
        });

        it('Does not store a login code for a blocked user or during the cooldown', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(CodeRepository.userLoginRequest(User, "token-hash", "code-hash", "block-token-hash", 60000)).resolves.toBe(false);
        });
    });


    /*==========*/
    /* Attempts */
    /*==========*/
    describe('Attempts on a login code', () => {
        it('Counts an attempt while the limit is not reached', async () => {
            await expect(CodeRepository.consumeLoginCodeAttempt(User.id, "token-hash", 5)).resolves.toBe(true);

            expect(getLastQueryValues()).toStrictEqual([User.id, "token-hash", 5]);
        });

        it('Refuses the attempt when the limit is reached or the code was replaced', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(CodeRepository.consumeLoginCodeAttempt(User.id, "token-hash", 5)).resolves.toBe(false);
        });
    });


    /*===============*/
    /* Login confirm */
    /*===============*/
    describe('Confirmation of a login', () => {
        it('Logs the user in from his IP address and returns him', async () => {
            const loggedInUser = buildUser({ is_connected: true });
            vi.mocked(Database.execute).mockResolvedValue([loggedInUser]);

            await expect(CodeRepository.userLoginConfirm(User, "127.0.0.1")).resolves.toBe(loggedInUser);
            expect(getLastQueryValues()).toStrictEqual([User.id, User.email, User.pseudo, User.last_logout_at.toISOString(), User.created_at.toISOString(), "127.0.0.1"]);
        });

        it('Fails when the user changed since the login request', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(CodeRepository.userLoginConfirm(User, null)).rejects.toMatchObject({ httpStatus: 404 });
        });
    });


    /*=================*/
    /* Database errors */
    /*=================*/
    describe('Database errors', () => {
        const queriesOfTheRepository: [string, () => Promise<unknown>][] = [
            ['userLoginRequest', () => CodeRepository.userLoginRequest(User, "token-hash", "code-hash", "block-token-hash", 60000)],
            ['consumeLoginCodeAttempt', () => CodeRepository.consumeLoginCodeAttempt(User.id, "token-hash", 5)],
            ['userLoginConfirm', () => CodeRepository.userLoginConfirm(User, null)],
        ];

        it.each(queriesOfTheRepository)('%s gives the error of the database to the caller', async (_functionName, callRepository) => {
            const databaseError = new Error("Database unknown error");
            vi.mocked(Database.execute).mockRejectedValue(databaseError);

            await expect(callRepository()).rejects.toBe(databaseError);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const User = buildUser();

/**
 * Reads the values of the last query sent to the database.
 * @returns Values of the query
 */
function getLastQueryValues(): unknown[] {
    const lastCall = vi.mocked(Database.execute).mock.lastCall!;
    return lastCall[0].values as unknown[];
}
