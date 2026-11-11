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
        it('Stores the hashes of the login code for the user, with his cooldown and the number of codes he already received', async () => {
            const userAfterTwoCodes = { ...User, login_requests_without_login: 2 };

            await expect(CodeRepository.userLoginRequest(userAfterTwoCodes, "token-hash", "code-hash", "block-token-hash", 60000)).resolves.toBe(true);

            expect(getLastQueryValues()).toStrictEqual([
                User.id, User.email, User.pseudo, User.last_logout_at.toISOString(), User.created_at.toISOString(),
                "token-hash", "code-hash", "block-token-hash", 60000, 2,
            ]);
        });

        it('Counts the new code in the same query, only if no other code was counted in the meantime', async () => {
            await CodeRepository.userLoginRequest(User, "token-hash", "code-hash", "block-token-hash", 60000);

            const query: string = vi.mocked(Database.execute).mock.calls[0][0].text;
            expect(query).toContain("login_requests_without_login = login_requests_without_login + 1");
            expect(query).toContain("login_requests_without_login = $10");
        });

        it('Does not store a login code for a blocked user or during the cooldown', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(CodeRepository.userLoginRequest(User, "token-hash", "code-hash", "block-token-hash", 60000)).resolves.toBe(false);
        });
    });


    /*============================*/
    /* Block after too many codes */
    /*============================*/
    describe('Block after too many login codes', () => {
        it('Blocks the logins of the user for the given time, only if no login started the count again in the meantime', async () => {
            const userAfterTenCodes = { ...User, login_requests_without_login: 10 };

            await CodeRepository.blockLoginsAfterTooManyCodes(userAfterTenCodes, 86400000);

            const query: string = vi.mocked(Database.execute).mock.calls[0][0].text;
            expect(query).toContain("login_blocked_until = NOW() + ($3::double precision * INTERVAL '1 millisecond')");
            expect(query).toContain("login_requests_without_login = $2");
            expect(getLastQueryValues()).toStrictEqual([User.id, 10, 86400000]);
        });

        it('Starts again the count of the codes from zero and cancels the pending code', async () => {
            await CodeRepository.blockLoginsAfterTooManyCodes(User, 86400000);

            const query: string = vi.mocked(Database.execute).mock.calls[0][0].text;
            expect(query).toContain("login_requests_without_login = 0");
            expect(query).toContain("secret_hash = null, token_hash = null");
        });

        it('Keeps the block link of the last email usable by the owner of the account', async () => {
            await CodeRepository.blockLoginsAfterTooManyCodes(User, 86400000);

            const query: string = vi.mocked(Database.execute).mock.calls[0][0].text;
            expect(query).not.toContain("login_block_token_hash");
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
        it('Starts again the count of the codes sent without login, which extends the cooldown and then blocks the logins', async () => {
            vi.mocked(Database.execute).mockResolvedValue([buildUser()]);

            await CodeRepository.userLoginConfirm(User, null);

            const query: string = vi.mocked(Database.execute).mock.calls[0][0].text;
            expect(query).toContain("login_requests_without_login = 0");
        });

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

        it('Never logs in a blocked account, even if a login code were still pending', async () => {
            vi.mocked(Database.execute).mockResolvedValue([buildUser()]);

            await CodeRepository.userLoginConfirm(User, null);

            const query: string = vi.mocked(Database.execute).mock.calls[0][0].text;
            expect(query).toContain("(login_blocked_until IS NULL OR login_blocked_until <= NOW())");
        });
    });


    /*=================*/
    /* Database errors */
    /*=================*/
    describe('Database errors', () => {
        const queriesOfTheRepository: [string, () => Promise<unknown>][] = [
            ['userLoginRequest', () => CodeRepository.userLoginRequest(User, "token-hash", "code-hash", "block-token-hash", 60000)],
            ['blockLoginsAfterTooManyCodes', () => CodeRepository.blockLoginsAfterTooManyCodes(User, 86400000)],
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
