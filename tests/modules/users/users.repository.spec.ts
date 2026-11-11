import type { UpdateUser, UserSafe } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import { Database } from "../../../src/core/models/Database.model";
import { isJwtFromClosedSession } from "../../../src/core/utils/jwt";
import { buildUser } from "./users.fixtures";



vi.mock("../../../src/config/AppConfig", () => ({
    default: { default_auth_method: "EMAIL_CODE" },
}));

/* The database is replaced, only the queries and the handling of their result are tested */
vi.mock("../../../src/core/models/Database.model", () => ({
    Database: { execute: vi.fn() },
}));

vi.mock("../../../src/core/utils/jwt", () => ({
    isJwtFromClosedSession: vi.fn(),
}));



/**
 * Users repository tests
 */
describe('Users repository', () => {
    beforeEach(() => {
        vi.mocked(Database.execute).mockResolvedValue([StoredUser]);
        vi.mocked(isJwtFromClosedSession).mockReturnValue(false);
    });


    /*========*/
    /* INSERT */
    /*========*/
    describe('Insertion of a user', () => {
        it('Inserts the user with the default authentication method and returns him', async () => {
            await expect(UsersRepository.insertUser(UserToInsert, "127.0.0.1", "email-verify-hash")).resolves.toBe(StoredUser);

            expect(getLastQuery().values).toStrictEqual([UserToInsert.email, UserToInsert.pseudo, "EMAIL_CODE", "127.0.0.1", "email-verify-hash"]);
        });

        it('Returns null when the email address is already used, so that the caller chooses the answer', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.insertUser(UserToInsert, null, "email-verify-hash")).resolves.toBeNull();
        });
    });


    /*========*/
    /* SELECT */
    /*========*/
    describe('Selection of the user of a JWT', () => {
        it('Returns the user who matches the JWT', async () => {
            await expect(UsersRepository.getUser(JwtUser)).resolves.toBe(StoredUser);

            expect(getLastQuery().values).toStrictEqual([JwtUser.id, JwtUser.email, JwtUser.pseudo, JwtUser.created_at.toString()]);
        });

        it('Fails when no user matches the JWT', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.getUser(JwtUser)).rejects.toMatchObject({ httpStatus: 404 });
        });

        it('Fails when the user is logged out', async () => {
            vi.mocked(Database.execute).mockResolvedValue([buildUser({ is_connected: false })]);

            await expect(UsersRepository.getUser(JwtUser)).rejects.toMatchObject({ message: 'User is not connected', httpStatus: 401 });
        });

        it('Fails when the JWT was issued before the last logout', async () => {
            vi.mocked(isJwtFromClosedSession).mockReturnValue(true);

            await expect(UsersRepository.getUser(JwtUser)).rejects.toMatchObject({ message: 'Session closed, please log in again', httpStatus: 401 });
        });

        it('Fails when the email address of the user was never proven, even with an open session', async () => {
            vi.mocked(Database.execute).mockResolvedValue([buildUser({ is_verified_email: false })]);

            await expect(UsersRepository.getUser(JwtUser)).rejects.toMatchObject({ message: UsersRepository.UNVERIFIED_EMAIL_MESSAGE, httpStatus: 401 });
        });

        it('Compares the dates of the JWT with their time zone, whatever the time zone of the database', async () => {
            await UsersRepository.getUser(JwtUser);

            expect(getLastQuery().text).toContain("$4::timestamptz");
            expect(getLastQuery().text).not.toMatch(/::timestamp\)/);
        });
    });

    describe('Check of an open session', () => {
        it('Accepts the session of a connected user whose email address is proven', () => {
            expect(() => UsersRepository.assertSessionIsOpen(JwtUser, buildUser())).not.toThrow();
        });

        it('Refuses a logged out user before the other checks', () => {
            vi.mocked(isJwtFromClosedSession).mockReturnValue(true);

            expect(() => UsersRepository.assertSessionIsOpen(JwtUser, buildUser({ is_connected: false, is_verified_email: false }))).toThrow('User is not connected');
        });
    });

    describe('Selection of a user by email or by ID', () => {
        it('Returns the user who has the email', async () => {
            await expect(UsersRepository._getUserByEmail("test1@test.fr")).resolves.toBe(StoredUser);

            expect(getLastQuery().values).toStrictEqual(["test1@test.fr"]);
        });

        it('Returns null when no user has the email', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository._getUserByEmail("unknown@test.fr")).resolves.toBeNull();
        });

        it('Returns the user who has the ID', async () => {
            await expect(UsersRepository._getUserById(1)).resolves.toBe(StoredUser);

            expect(getLastQuery().values).toStrictEqual([1]);
        });

        it('Fails when no user has the ID', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository._getUserById(404)).rejects.toMatchObject({ httpStatus: 404 });
        });
    });


    /*========*/
    /* UPDATE */
    /*========*/
    describe('Update of a user', () => {
        it('Updates each field given, after the fields which identify the user', async () => {
            await expect(UsersRepository.updateUser(UserUpdate, JwtUser)).resolves.toBe(StoredUser);

            const query = getLastQuery();
            expect(query.text).toContain("SET email = $6, pseudo = $7 WHERE id = $1");
            expect(query.values).toStrictEqual([...JwtUserIdentification, UserUpdate.email, UserUpdate.pseudo]);
        });

        it('Ignores the fields which do not belong to the update itself', async () => {
            const updateWithInheritedField = Object.assign(Object.create({ is_admin: true }), UserUpdate) as UpdateUser;

            await UsersRepository.updateUser(updateWithInheritedField, JwtUser);

            expect(getLastQuery().text).not.toContain("is_admin");
        });

        it('Fails when no connected user matches the JWT', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.updateUser(UserUpdate, JwtUser)).rejects.toMatchObject({ httpStatus: 404 });
        });

        it('Changes the email and marks it as not verified in the same query', async () => {
            await expect(UsersRepository.updateUserWithUnverifiedEmail(UserUpdate, JwtUser, "email-verify-hash")).resolves.toBe(StoredUser);

            const query = getLastQuery();
            expect(query.text).toContain("is_verified_email = false");
            expect(query.values).toStrictEqual([...JwtUserIdentification, UserUpdate.email, UserUpdate.pseudo, "email-verify-hash"]);
        });

        it('Fails to change the email when no connected user matches the JWT', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.updateUserWithUnverifiedEmail(UserUpdate, JwtUser, "email-verify-hash")).rejects.toMatchObject({ httpStatus: 404 });
        });

        it('Stores the hash of a new email verification token', async () => {
            await expect(UsersRepository.updateUserEmailVerifyTokenHash(1, "email-verify-hash")).resolves.toBeUndefined();

            expect(getLastQuery().values).toStrictEqual(["email-verify-hash", 1]);
        });

        it('Marks the email as verified and closes the sessions opened before', async () => {
            await expect(UsersRepository.UserEmailVerify(1)).resolves.toBeUndefined();

            const query = getLastQuery();
            expect(query.text).toContain("is_verified_email = true");
            expect(query.text).toContain("is_connected = false");
            expect(query.values).toStrictEqual([1]);
        });

        it('Invalidates the JWT of a user and returns him', async () => {
            await expect(UsersRepository.invalidateUserSessions(1)).resolves.toBe(StoredUser);

            expect(getLastQuery().values).toStrictEqual([1]);
        });

        it('Fails to invalidate the JWT of a user who does not exist', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.invalidateUserSessions(404)).rejects.toMatchObject({ httpStatus: 404 });
        });
    });


    /*========*/
    /* DELETE */
    /*========*/
    describe('Deletion and logout of a user', () => {
        it('Deletes the connected user who matches the JWT', async () => {
            await expect(UsersRepository.deleteUser(JwtUser)).resolves.toBe(StoredUser);

            expect(getLastQuery().values).toStrictEqual(JwtUserIdentification);
        });

        it('Fails to delete when no connected user matches the JWT', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.deleteUser(JwtUser)).rejects.toMatchObject({ httpStatus: 404 });
        });

        it('Logs out the user who matches the JWT', async () => {
            await expect(UsersRepository.logoutUser(JwtUser)).resolves.toBe(StoredUser);

            expect(getLastQuery().text).toContain("is_connected = false, last_logout_at = NOW()");
            expect(getLastQuery().values).toStrictEqual(JwtUserIdentification);
        });

        it('Fails to log out when no user matches the JWT', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.logoutUser(JwtUser)).rejects.toMatchObject({ httpStatus: 404 });
        });
    });


    /*=============*/
    /* Login block */
    /*=============*/
    describe('Login block', () => {
        it('Blocks the logins of the user who has the block token', async () => {
            vi.mocked(Database.execute).mockResolvedValue([{ id: 1 }]);

            await expect(UsersRepository.blockUserLogin(1, "block-token-hash", 3600000, true)).resolves.toBe(true);
            expect(getLastQuery().values).toStrictEqual([1, "block-token-hash", 3600000, true]);
        });

        it('Does not block when the block link was already used', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(UsersRepository.blockUserLogin(1, "block-token-hash", 3600000, false)).resolves.toBe(false);
        });

        it('Starts again from zero the count of the codes sent without a successful login, like the block made by the API', async () => {
            vi.mocked(Database.execute).mockResolvedValue([{ id: 1 }]);

            await UsersRepository.blockUserLogin(1, "block-token-hash", 3600000, false);

            expect(getLastQuery().text).toContain("login_requests_without_login = 0");
        });
    });


    /*=================*/
    /* Database errors */
    /*=================*/
    describe('Database errors', () => {
        const queriesOfTheRepository: [string, () => Promise<unknown>][] = [
            ['insertUser', () => UsersRepository.insertUser(UserToInsert, null, "email-verify-hash")],
            ['getUser', () => UsersRepository.getUser(JwtUser)],
            ['updateUser', () => UsersRepository.updateUser(UserUpdate, JwtUser)],
            ['deleteUser', () => UsersRepository.deleteUser(JwtUser)],
            ['logoutUser', () => UsersRepository.logoutUser(JwtUser)],
            ['blockUserLogin', () => UsersRepository.blockUserLogin(1, "block-token-hash", 3600000, false)],
            ['updateUserEmailVerifyTokenHash', () => UsersRepository.updateUserEmailVerifyTokenHash(1, null)],
            ['UserEmailVerify', () => UsersRepository.UserEmailVerify(1)],
            ['_getUserByEmail', () => UsersRepository._getUserByEmail("test1@test.fr")],
            ['_getUserById', () => UsersRepository._getUserById(1)],
            ['updateUserWithUnverifiedEmail', () => UsersRepository.updateUserWithUnverifiedEmail(UserUpdate, JwtUser, "email-verify-hash")],
            ['invalidateUserSessions', () => UsersRepository.invalidateUserSessions(1)],
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
const StoredUser = buildUser();

const UserToInsert = {
    email: "test1@test.fr",
    pseudo: "Pseudo",
};

const UserUpdate: UpdateUser = {
    email: "new-address@test.fr",
    pseudo: "New pseudo",
};

const JwtUser: UserSafe = {
    id: 1,
    email: "test1@test.fr",
    pseudo: "Pseudo",

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_logout_at: new Date("2026-01-01T10:00:00.000Z"),

    created_at: new Date("2025-01-01T10:00:00.000Z"),
};

/* The values which identify the user of a JWT in the queries, in their order */
const JwtUserIdentification = [JwtUser.id, JwtUser.email, JwtUser.pseudo, JwtUser.last_logout_at.toString(), JwtUser.created_at.toString()];

/**
 * Reads the last query sent to the database.
 * @returns Text and values of the query
 */
function getLastQuery(): { text: string, values: unknown[] } {
    const lastCall = vi.mocked(Database.execute).mock.lastCall!;
    return lastCall[0] as { text: string, values: unknown[] };
}
