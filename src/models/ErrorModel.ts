/**
 * Custom Error interface to include HTTP status codes and internal status codes.
 * @param message Error message (default: "Unknown error")
 * @param httpStatus HTTP status code (default: 500)
 * @param internalStatus Internal status code for application-specific errors (e.g., from 1 to internalMessage.length-1). (Default: 1)
 * @example
 * next(new AppError()); // Uses default values
 * next(new AppError("Unknown error", 500, 1)); // Explicitly using default values
 * next(new AppError("Database connection failed", 500)); // Uses default internalStatus
 * next(new AppError("Database connection failed", 500, 2));
 */
export class AppError extends Error {
    message: string;
    httpStatus: number;
    internalStatus: number;

    constructor(message?: string, httpStatus?: number, internalStatus?: number) {
        const defaultMessage = "Unknown error";
        message = message || defaultMessage;
        super(message);
        this.message = message;
        this.httpStatus = httpStatus || 500;
        this.internalStatus = internalStatus || 1;
    }
}



/**
 * Internal status messages
 * 0 is reserved for success
 * 1 is reserved for unknown error
 */
export const internalMessage: string[] = [
    "Success",
    "Unknown error",
    "Url does not exist",
];