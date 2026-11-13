import { Request, Response, NextFunction } from 'express';
import { STATUS_CODES } from 'node:http';
import logger from '../utils/logger';
import { AppError } from '../models/AppError.model';



/**
 * Middleware to handle errors.
 *
 * The errors of the API (AppError) send their own status and message.
 * The errors raised by Express for an invalid request (malformed JSON, body too large) keep their status,
 * with the standard text of this status: the details of the parser only go to the logs.
 * Any other error is a bug: it is logged as an error, and the client only receives "Internal Server Error".
 * @param error Error raised by a route or a middleware
 * @param _req Request
 * @param res Response
 * @param _next NextFunction, required by Express to recognize an error handler
 */
export const errorHandler = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    const httpStatus = getHttpStatus(error);
    logError(error, httpStatus);

    res.status(httpStatus).json(getClientMessage(error, httpStatus));
};


/**
 * Finds the HTTP status to send for an error.
 * @param error Error to answer
 * @returns The status of the error, or 500 for an unexpected error
 */
function getHttpStatus(error: unknown): number {
    if (error instanceof AppError) { return error.httpStatus || 500; }
    if (isInvalidRequestError(error)) { return error.status; }

    return 500;
}


/**
 * Checks if an error was raised by Express or by its body parser because of an invalid request.
 * These errors carry a status between 400 and 499, like the errors of the "http-errors" package.
 * @param error Error to check
 * @returns True if the error comes from an invalid request
 */
function isInvalidRequestError(error: unknown): error is { status: number } {
    const status: unknown = (error as { status?: unknown } | null)?.status;

    return typeof status === 'number' && status >= 400 && status < 500;
}


/**
 * Builds the message sent to the client.
 * Only the messages written by the API are sent: the others could reveal how the server works.
 * @param error Error to answer
 * @param httpStatus Status sent with the message
 * @returns The message of the error, or the standard text of the status
 */
function getClientMessage(error: unknown, httpStatus: number): string {
    if (error instanceof AppError && error.message) { return error.message; }

    return STATUS_CODES[httpStatus] || "Internal Server Error";
}


/**
 * Logs an error with the level of its status: only the errors of the server are logged as errors (and emailed in production).
 * @param error Error to log
 * @param httpStatus Status sent for this error
 */
function logError(error: unknown, httpStatus: number): void {
    const errorDetails: unknown = (error instanceof Error) ? error.stack : error;

    if (httpStatus >= 500) {
        logger.error(errorDetails);
        return;
    }

    if (httpStatus >= 400) {
        logger.warning(errorDetails);
        return;
    }

    logger.info(errorDetails);
}
