import { describe, it, expect } from "vitest";
import { defaultRouteHandler } from "../../../src/core/middlewares/default_route.middleware";
import { AppError } from "../../../src/core/models/AppError.model";
import { buildNext, buildRequest, buildResponse } from "../../fixtures/express.fixtures";



/**
 * Default route tests
 */
describe('Default route', () => {
    it('Gives a 404 error to the error handler for a URL which matches no route', () => {
        const next = buildNext();

        defaultRouteHandler(buildRequest(), buildResponse(), next);

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        expect(next.mock.calls[0][0]).toMatchObject({ message: "URL not found", httpStatus: 404 });
    });
});
