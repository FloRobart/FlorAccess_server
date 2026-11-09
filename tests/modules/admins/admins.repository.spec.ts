import type { UserSafe } from "../../../src/modules/users/users.types";
import type { UserAdminUpdate } from "../../../src/modules/admins/admins.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as AdminsRepository from "../../../src/modules/admins/admins.repository";
import { Database } from "../../../src/core/models/Database.model";
import { isJwtFromClosedSession } from "../../../src/core/utils/jwt";
import { buildUser } from "../users/users.fixtures";



/* The database is replaced, only the queries and the handling of their result are tested */
vi.mock("../../../src/core/models/Database.model", () => ({
    Database: { execute: vi.fn() },
}));

vi.mock("../../../src/core/utils/jwt", () => ({
    isJwtFromClosedSession: vi.fn(),
}));



/**
 * Administrators repository tests
 */
describe('Administrators repository', () => {
    beforeEach(() => {
        vi.mocked(Database.execute).mockResolvedValue([StoredUser]);
        vi.mocked(isJwtFromClosedSession).mockReturnValue(false);
    });


    /*================*/
    /* Administrators */
    /*================*/
    describe('Administrator check', () => {
        it('Tells if the connected user of the JWT is an administrator', async () => {
            vi.mocked(Database.execute).mockResolvedValue([buildUser({ is_admin: true })]);
            await expect(AdminsRepository.isAdmin(JwtUser)).resolves.toBe(true);

            vi.mocked(Database.execute).mockResolvedValue([buildUser({ is_admin: false })]);
            await expect(AdminsRepository.isAdmin(JwtUser)).resolves.toBe(false);

            expect(getLastQuery().values).toStrictEqual([JwtUser.id, JwtUser.email, JwtUser.pseudo, JwtUser.created_at.toString()]);
        });

        it('Fails when no user matches the JWT', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(AdminsRepository.isAdmin(JwtUser)).rejects.toMatchObject({ httpStatus: 404 });
        });

        it('Fails when the user is logged out', async () => {
            vi.mocked(Database.execute).mockResolvedValue([buildUser({ is_connected: false, is_admin: true })]);

            await expect(AdminsRepository.isAdmin(JwtUser)).rejects.toMatchObject({ message: 'User is not connected', httpStatus: 401 });
        });

        it('Fails when the JWT was issued before the last logout', async () => {
            vi.mocked(isJwtFromClosedSession).mockReturnValue(true);

            await expect(AdminsRepository.isAdmin(JwtUser)).rejects.toMatchObject({ message: 'Session closed, please log in again', httpStatus: 401 });
        });
    });


    /*========*/
    /* SELECT */
    /*========*/
    describe('Selection of the users', () => {
        it('Returns one page of the users', async () => {
            await expect(AdminsRepository.selectUsers({ limit: 10, offset: 20 })).resolves.toStrictEqual([StoredUser]);

            expect(getLastQuery().values).toStrictEqual([10, 20]);
        });

        it('Counts the users', async () => {
            vi.mocked(Database.execute).mockResolvedValue([{ count: "42" }]);

            await expect(AdminsRepository.countUsers()).resolves.toBe(42);
        });
    });


    /*========*/
    /* UPDATE */
    /*========*/
    describe('Update of a user', () => {
        it('Updates each field given, after the fields which identify the user', async () => {
            const update: UserAdminUpdate = { pseudo: "New pseudo", is_connected: false };

            await expect(AdminsRepository.updateUser(update, StoredUser)).resolves.toBe(StoredUser);

            const query = getLastQuery();
            expect(query.text).toContain("SET pseudo = $7, is_connected = $8 WHERE id = $1");
            expect(query.values).toStrictEqual([
                StoredUser.id, StoredUser.is_connected, StoredUser.email, StoredUser.pseudo, StoredUser.last_logout_at.toISOString(), StoredUser.created_at.toISOString(),
                "New pseudo", false,
            ]);
        });

        it('Ignores the fields without value and the fields which do not belong to the update itself', async () => {
            const update = Object.assign(Object.create({ is_admin: true }), { pseudo: "New pseudo", email: undefined }) as UserAdminUpdate;

            await AdminsRepository.updateUser(update, StoredUser);

            const query = getLastQuery();
            expect(query.text).toContain("SET pseudo = $7 WHERE id = $1");
            expect(query.values).toHaveLength(7);
        });

        it('Fails when the user changed since he was read', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(AdminsRepository.updateUser({ pseudo: "New pseudo" }, StoredUser)).rejects.toMatchObject({ httpStatus: 404 });
        });
    });


    /*========*/
    /* DELETE */
    /*========*/
    describe('Deletion of a user', () => {
        it('Deletes the user who has the ID', async () => {
            await expect(AdminsRepository.deleteUser(1)).resolves.toBeUndefined();

            expect(getLastQuery().values).toStrictEqual([1]);
        });

        it('Fails when no user has the ID', async () => {
            vi.mocked(Database.execute).mockResolvedValue([]);

            await expect(AdminsRepository.deleteUser(404)).rejects.toMatchObject({ httpStatus: 404 });
        });
    });


    /*=================*/
    /* Database errors */
    /*=================*/
    describe('Database errors', () => {
        const queriesOfTheRepository: [string, () => Promise<unknown>][] = [
            ['isAdmin', () => AdminsRepository.isAdmin(JwtUser)],
            ['selectUsers', () => AdminsRepository.selectUsers({ limit: null, offset: 0 })],
            ['countUsers', () => AdminsRepository.countUsers()],
            ['updateUser', () => AdminsRepository.updateUser({ pseudo: "New pseudo" }, StoredUser)],
            ['deleteUser', () => AdminsRepository.deleteUser(1)],
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

/**
 * Reads the last query sent to the database.
 * @returns Text and values of the query
 */
function getLastQuery(): { text: string, values: unknown[] } {
    const lastCall = vi.mocked(Database.execute).mock.lastCall!;
    return lastCall[0] as { text: string, values: unknown[] };
}
