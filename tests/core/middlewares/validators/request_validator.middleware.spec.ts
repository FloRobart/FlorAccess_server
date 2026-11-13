import type { ZodType } from "zod";

import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { requestValidator } from "../../../../src/core/middlewares/validators/request_validator.middleware";
import logger from "../../../../src/core/utils/logger";
import { buildNext, buildRequest, buildResponse } from "../../../fixtures/express.fixtures";



vi.mock("../../../../src/core/utils/logger", () => ({
    default: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));



/**
 * Request validator tests
 */
describe('Request validator', () => {
    it('Validates the body, the parameters and the query together', () => {
        const request = buildRequest({ body: { pseudo: " Pseudo " }, params: { userId: "1" }, query: { limit: "10" } });
        const next = buildNext();

        requestValidator(RequestSchema)(request, buildResponse(), next);

        expect(request.body.validatedData).toStrictEqual({ pseudo: "Pseudo", userId: "1", limit: "10" });
        expect(next).toHaveBeenCalledWith();
    });

    it('Adds its data to the data already validated by a previous validator', () => {
        const request = buildRequest({ body: { validatedData: { email: "test1@test.fr" } }, params: { userId: "1" } });

        requestValidator(z.object({ userId: z.string() }))(request, buildResponse(), buildNext());

        expect(request.body.validatedData).toStrictEqual({ email: "test1@test.fr", userId: "1" });
    });

    it('Validates a request without body', () => {
        const request = buildRequest({ body: undefined, params: { userId: "1" } });
        const next = buildNext();

        requestValidator(z.object({ userId: z.string() }))(request, buildResponse(), next);

        expect(request.body).toStrictEqual({ validatedData: { userId: "1" } });
        expect(next).toHaveBeenCalledWith();
    });

    it('Refuses an invalid request with a 400 error, logged as a warning only', () => {
        const next = buildNext();

        requestValidator(RequestSchema)(buildRequest({ body: { pseudo: 123 } }), buildResponse(), next);

        expect(logger.warning).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toMatchObject({ message: "Bad Request", httpStatus: 400 });
    });

    it('Refuses a schema which does not give an object', () => {
        for (const notAnObject of [null, "text"]) {
            const next = buildNext();

            requestValidator(z.unknown().transform(() => notAnObject))(buildRequest(), buildResponse(), next);

            expect(next.mock.calls[0][0]).toMatchObject({ message: "Bad Request", httpStatus: 400 });
        }
    });

    it('Refuses the request with a 400 error when the validation fails unexpectedly', () => {
        const failingSchema = { parse: () => { throw new Error("Unexpected failure"); } } as unknown as ZodType;
        const next = buildNext();

        requestValidator(failingSchema)(buildRequest(), buildResponse(), next);

        expect(logger.warning).not.toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toMatchObject({ message: "Bad Request", httpStatus: 400 });
    });
});


/*===========*/
/* Test data */
/*===========*/
const RequestSchema = z.object({
    pseudo: z.string().trim(),
    userId: z.string().optional(),
    limit: z.string().optional(),
});
