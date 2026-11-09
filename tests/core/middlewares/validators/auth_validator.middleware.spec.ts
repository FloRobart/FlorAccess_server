import { describe, it, expect, vi } from "vitest";
import { authorizationValidator } from "../../../../src/core/middlewares/validators/auth_validator.middleware";
import { AuthorizationHeaderSchema } from "../../../../src/modules/users/users.schema";
import { verifyJwt } from "../../../../src/core/utils/jwt";
import { AppError } from "../../../../src/core/models/AppError.model";
import { buildNext, buildRequest, buildResponse } from "../../../fixtures/express.fixtures";



/* The signature of the JWT is tested with the JWT utilities, only the rules of the middleware are tested here */
vi.mock("../../../../src/core/utils/jwt", () => ({
    verifyJwt: vi.fn(),
}));



/**
 * Authorization validator tests
 */
describe('Authorization validator', () => {
    const validateAuthorization = authorizationValidator(AuthorizationHeaderSchema);


    it('Lets the request go on when the header carries a valid JWT', async () => {
        const next = buildNext();

        await validateAuthorization(buildRequest({ headers: { authorization: AuthorizationHeader } }), buildResponse(), next);

        expect(verifyJwt).toHaveBeenCalledWith(Jwt);
        expect(next).toHaveBeenCalledWith();
    });

    it('Refuses a header which is not a bearer JWT', async () => {
        const next = buildNext();

        await validateAuthorization(buildRequest({ headers: { authorization: "Basic dXNlcjpwYXNzd29yZA==" } }), buildResponse(), next);

        expect(verifyJwt).not.toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toMatchObject({ message: "Invalid Authorization header", httpStatus: 401 });
    });

    it('Gives the error of an invalid JWT to the error handler', async () => {
        const invalidJwtError = new AppError("Invalid JWT", 401);
        vi.mocked(verifyJwt).mockImplementationOnce(() => { throw invalidJwtError; });
        const next = buildNext();

        await validateAuthorization(buildRequest({ headers: { authorization: AuthorizationHeader } }), buildResponse(), next);

        expect(next).toHaveBeenCalledWith(invalidJwtError);
    });
});


/*===========*/
/* Test data */
/*===========*/
const Jwt: string = "header.payload.signature";
const AuthorizationHeader: string = `Bearer ${Jwt}`;
