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
    /*===================*/
    /* Errors of the API */
    /*===================*/
    describe('Errors of the API', () => {
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

        it('Sends the standard text of the status when the error of the API has no message', () => {
            const response = buildResponse();

            errorHandler(new AppError("", 404), buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith("Not Found");
        });

        it('Sends a 500 error for an error of the API without status', () => {
            const response = buildResponse();

            errorHandler(new AppError("Broken", 0), buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith("Broken");
        });
    });


    /*======================================*/
    /* Invalid requests detected by Express */
    /*======================================*/
    describe('Invalid requests detected by Express', () => {
        it('Answers a malformed JSON body with a 400 error, without the details of the parser, and logs it as a warning', () => {
            const parserError = Object.assign(new SyntaxError("Unexpected token } in JSON at position 10"), { status: 400, type: "entity.parse.failed" });
            const response = buildResponse();

            errorHandler(parserError, buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith("Bad Request");
            expect(logger.warning).toHaveBeenCalledWith(parserError.stack);
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('Answers a body too large with a 413 error', () => {
            const response = buildResponse();

            errorHandler(Object.assign(new Error("request entity too large"), { status: 413 }), buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(413);
            expect(response.json).toHaveBeenCalledWith("Payload Too Large");
        });

        it('Keeps the generic text for a client error status which has no standard text', () => {
            const response = buildResponse();

            errorHandler({ status: 499 }, buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(499);
            expect(response.json).toHaveBeenCalledWith("Internal Server Error");
            expect(logger.warning).toHaveBeenCalledWith({ status: 499 });
        });
    });


    /*===================*/
    /* Unexpected errors */
    /*===================*/
    describe('Unexpected errors', () => {
        it('Sends a 500 internal server error for an error without status nor message', () => {
            const unexpectedError = new Error("");
            const response = buildResponse();

            errorHandler(unexpectedError, buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith("Internal Server Error");
        });

        it('Logs an unexpected error as an error, but never sends its message to the client', () => {
            const unexpectedError = new TypeError("Cannot read properties of undefined (reading 'email')");
            const response = buildResponse();

            errorHandler(unexpectedError, buildRequest(), response, buildNext());

            expect(logger.error).toHaveBeenCalledWith(unexpectedError.stack);
            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith("Internal Server Error");
        });

        it('Handles a server error status carried by an error which does not come from the API like an unexpected error', () => {
            const response = buildResponse();

            errorHandler(Object.assign(new Error("Service down"), { status: 503 }), buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith("Internal Server Error");
        });

        it('Logs a value which is not an error as it is', () => {
            errorHandler("Something wrong happened", buildRequest(), buildResponse(), buildNext());
            errorHandler(null, buildRequest(), buildResponse(), buildNext());

            expect(logger.error).toHaveBeenCalledWith("Something wrong happened");
            expect(logger.error).toHaveBeenCalledWith(null);
        });
    });
});
