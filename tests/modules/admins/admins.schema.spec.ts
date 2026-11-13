import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import { authorizedQueryParamsSchema, EmailAdminSchema, UserAdminSchema, UserAdminUpdateSchema, UserIdListSchema, UserIdSchema } from "../../../src/modules/admins/admins.schema";
import { buildUser } from "../users/users.fixtures";



/**
 * Administrators schemas tests
 */
describe('Administrators schemas', () => {
    /*========*/
    /* SELECT */
    /*========*/
    describe('User admin schema', () => {
        it('Keeps the information an administrator can see, without the secrets', () => {
            const userAdmin = UserAdminSchema.parse({ ...buildUser({ secret_hash: "secret" }), updated_at: new Date() });

            expect(userAdmin).toHaveProperty("is_admin");
            expect(userAdmin).toHaveProperty("last_ip");
            expect(userAdmin).toHaveProperty("login_blocked_until");
            expect(userAdmin).not.toHaveProperty("secret_hash");
            expect(userAdmin).not.toHaveProperty("token_hash");
        });

        it('Refuses a user without update date', () => {
            expect(() => UserAdminSchema.parse(buildUser())).toThrow(ZodError);
        });
    });

    describe('Authorized query parameters schema', () => {
        it('Returns all the users from the first one by default', () => {
            expect(authorizedQueryParamsSchema.parse({})).toStrictEqual({ limit: null, offset: 0 });
        });

        it('Reads the numbers written as text in the query', () => {
            expect(authorizedQueryParamsSchema.parse({ limit: "10", offset: "20" })).toStrictEqual({ limit: 10, offset: 20 });
        });

        it('Refuses a limit below 1, a negative offset or a decimal number', () => {
            for (const queryParams of [{ limit: "0" }, { offset: "-1" }, { limit: "1.5" }, { offset: "abc" }]) {
                expect(() => authorizedQueryParamsSchema.parse(queryParams)).toThrow(ZodError);
            }
        });
    });


    /*========*/
    /* UPDATE */
    /*========*/
    describe('User ID schema', () => {
        it('Reads the ID written as text in the URL', () => {
            expect(UserIdSchema.parse({ userId: "42" })).toStrictEqual({ userId: 42 });
        });

        it('Refuses an ID which is not a positive integer', () => {
            for (const userId of ["0", "-1", "1.5", "abc"]) {
                expect(() => UserIdSchema.parse({ userId: userId })).toThrow(ZodError);
            }
        });
    });

    describe('User admin update schema', () => {
        it('Accepts any part of the fields an administrator can change', () => {
            expect(UserAdminUpdateSchema.parse({})).toStrictEqual({});
            expect(UserAdminUpdateSchema.parse({ pseudo: " New pseudo ", is_connected: false })).toStrictEqual({ pseudo: "New pseudo", is_connected: false });
        });

        it('Ignores the fields an administrator can not change', () => {
            expect(UserAdminUpdateSchema.parse({ id: 2, is_admin: true, created_at: new Date() })).toStrictEqual({});
        });

        it('Ignores the block of the logins, which is lifted by its own route', () => {
            expect(UserAdminUpdateSchema.parse({ login_blocked_until: null })).toStrictEqual({});
        });

        it('Refuses an invalid value', () => {
            expect(() => UserAdminUpdateSchema.parse({ email: "invalid-email" })).toThrow(ZodError);
        });
    });


    /*=======*/
    /* Email */
    /*=======*/
    describe('User ID list schema', () => {
        it('Gives the list of IDs itself', () => {
            expect(UserIdListSchema.parse({ userIdList: [1, 2, 3] })).toStrictEqual([1, 2, 3]);
        });

        it('Refuses an empty list or an ID which is not a positive integer', () => {
            for (const userIdList of [[], [0], [1.5], ["1"]]) {
                expect(() => UserIdListSchema.parse({ userIdList: userIdList })).toThrow(ZodError);
            }
        });
    });

    describe('Email admin schema', () => {
        it('Accepts an email with an object and a message for a list of users', () => {
            const emailAdmin = { userIdList: [1], object: "Maintenance", message: "The API will be stopped tonight." };

            expect(EmailAdminSchema.parse(emailAdmin)).toStrictEqual(emailAdmin);
        });

        it('Refuses an email without object or message, or with an object too long', () => {
            for (const emailAdmin of [
                { userIdList: [1], object: "", message: "Message" },
                { userIdList: [1], object: "Object", message: "" },
                { userIdList: [1], object: "O".repeat(256), message: "Message" },
            ]) {
                expect(() => EmailAdminSchema.parse(emailAdmin)).toThrow(ZodError);
            }
        });
    });
});
