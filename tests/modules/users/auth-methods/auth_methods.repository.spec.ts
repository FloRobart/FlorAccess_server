import { describe, it, expect, vi } from "vitest";
import { _getAuth_methodsById } from "../../../../src/modules/users/auth-methods/auth_methods.repository";
import { Database } from "../../../../src/core/models/Database.model";



/* The database is replaced, only the handling of the result of the query is tested */
vi.mock("../../../../src/core/models/Database.model", () => ({
    Database: { execute: vi.fn() },
}));



/**
 * Auth methods repository tests
 */
describe('Auth methods repository', () => {
    it('Returns the authentication method which has the ID', async () => {
        vi.mocked(Database.execute).mockResolvedValue([EmailCodeAuthMethod]);

        await expect(_getAuth_methodsById(1)).resolves.toBe(EmailCodeAuthMethod);
        expect(Database.execute).toHaveBeenCalledWith({ text: expect.any(String), values: [1] });
    });

    it('Fails when no authentication method has the ID', async () => {
        vi.mocked(Database.execute).mockResolvedValue([]);

        await expect(_getAuth_methodsById(404)).rejects.toMatchObject({ message: 'Auth method not found', httpStatus: 404 });
    });

    it('Gives the error of the database to the caller', async () => {
        const databaseError = new Error("Database unknown error");
        vi.mocked(Database.execute).mockRejectedValue(databaseError);

        await expect(_getAuth_methodsById(1)).rejects.toBe(databaseError);
    });
});


/*===========*/
/* Test data */
/*===========*/
const EmailCodeAuthMethod = {
    id: 1,
    immuable_method_name: "EMAIL_CODE",
    display_name: "Code",

    created_at: new Date(),
    updated_at: new Date(),
};
