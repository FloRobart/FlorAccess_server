import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "../../../src/core/middlewares/error.middleware";
import { AppError } from "../../../src/core/models/AppError.model";
import logger from "../../../src/core/utils/logger";
import { buildNext, buildRequest, buildResponse } from "../../fixtures/express.fixtures";



/* The logger would send an email for the errors of the server */
vi.mock("../../../src/core/utils/logger", () => ({
    default: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));



/**
 * Error handler tests
 */
describe('Error handler', () => {
    it('Logs an error of the server as an error, and sends its status and message', () => {
        const error = new AppError("Database unknown error", 500);
        const response = buildResponse();

        errorHandler(error, buildRequest(), response, buildNext());

        expect(logger.error).toHaveBeenCalledWith(error.stack);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith("Database unknown error");
    });

    it('Logs an error of the client as a warning', () => {
        const error = new AppError("User not found", 404);
        const response = buildResponse();

        errorHandler(error, buildRequest(), response, buildNext());

        expect(logger.warning).toHaveBeenCalledWith(error.stack);
        expect(logger.error).not.toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(404);
        expect(response.json).toHaveBeenCalledWith("User not found");
    });

    it('Logs a status below 400 as an information', () => {
        const error = new AppError("Redirection", 302);

        errorHandler(error, buildRequest(), buildResponse(), buildNext());

        expect(logger.info).toHaveBeenCalledWith(error.stack);
    });

    it('Sends a 500 internal server error for an error without status nor message', () => {
        const unexpectedError = new Error("") as AppError;
        const response = buildResponse();

        errorHandler(unexpectedError, buildRequest(), response, buildNext());

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith("Internal Server Error");
    });
});
