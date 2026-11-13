import type { UserSafe } from "../../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminsAuthorizationValidator } from "../../../../src/core/middlewares/validators/admins_auth_validator.middleware";
import { AuthorizationHeaderSchema } from "../../../../src/modules/users/users.schema";
import { verifyJwt } from "../../../../src/core/utils/jwt";
import { isAdmin } from "../../../../src/modules/admins/admins.service";
import { AppError } from "../../../../src/core/models/AppError.model";
import { buildNext, buildRequest, buildResponse } from "../../../fixtures/express.fixtures";



/* The JWT and the database are replaced, only the rules of the middleware are tested */
vi.mock("../../../../src/core/utils/jwt", () => ({
    verifyJwt: vi.fn(),
}));

vi.mock("../../../../src/modules/admins/admins.service", () => ({
    isAdmin: vi.fn(),
}));



/**
 * Administrators authorization validator tests
 */
describe('Administrators authorization validator', () => {
    const validateAdminAuthorization = adminsAuthorizationValidator(AuthorizationHeaderSchema);

    beforeEach(() => {
        vi.mocked(verifyJwt).mockReturnValue(DecodedUser);
    });


    it('Lets an administrator go on', async () => {
        vi.mocked(isAdmin).mockResolvedValue(true);
        const next = buildNext();

        await validateAdminAuthorization(buildRequest({ headers: { authorization: AuthorizationHeader } }), buildResponse(), next);

        expect(isAdmin).toHaveBeenCalledWith(DecodedUser);
        expect(next).toHaveBeenCalledWith();
    });

    it('Refuses a user who is not an administrator', async () => {
        vi.mocked(isAdmin).mockResolvedValue(false);
        const next = buildNext();

        await validateAdminAuthorization(buildRequest({ headers: { authorization: AuthorizationHeader } }), buildResponse(), next);

        expect(next.mock.calls[0][0]).toMatchObject({ httpStatus: 403 });
    });

    it('Refuses a header which is not a bearer JWT', async () => {
        const next = buildNext();

        await validateAdminAuthorization(buildRequest({ headers: {} }), buildResponse(), next);

        expect(isAdmin).not.toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toMatchObject({ message: "Invalid Authorization header", httpStatus: 401 });
    });

    it('Gives the error of the administrator check to the error handler', async () => {
        const closedSessionError = new AppError("Session closed, please log in again", 401);
        vi.mocked(isAdmin).mockRejectedValue(closedSessionError);
        const next = buildNext();

        await validateAdminAuthorization(buildRequest({ headers: { authorization: AuthorizationHeader } }), buildResponse(), next);

        expect(next).toHaveBeenCalledWith(closedSessionError);
    });
});


/*===========*/
/* Test data */
/*===========*/
const AuthorizationHeader: string = "Bearer header.payload.signature";

const DecodedUser: UserSafe = {
    id: 1,
    email: "admin@test.fr",
    pseudo: "Admin",

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_logout_at: new Date(),

    created_at: new Date(),
};
