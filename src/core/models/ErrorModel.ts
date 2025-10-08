/**
 * Custom Error interface to include HTTP status codes and internal status codes.
 * @param message Error message (default: "Unknown error")
 * @param httpStatus HTTP status code (default: 500)
 * @param internalStatus Internal status code for application-specific errors (e.g., from 1 to internalMessage.length-1). (default: 1)
 * @param stackTrace Optional stack trace or error object for debugging purposes (default: undefined)
 */
interface AppErrorOptions {
    message?: string;
    httpStatus?: number;
    internalStatus?: number;
    stackTrace?: any;
}


/**
 * Custom Error interface to include HTTP status codes and internal status codes.
 * @param message Error message (default: "Unknown error")
 * @param httpStatus HTTP status code (default: 500)
 * @param internalStatus Internal status code for application-specific errors (e.g., from 1 to internalMessage.length-1). (Default: 1)
 * @param stackTrace Optional stack trace or error object for debugging purposes
 * @example
 * next(new AppError()); // Uses default values
 * next(new AppError({message: "Unknown error", httpStatus: 500, internalStatus: 1, stackTrace: undefined})); // Explicitly using default values
 * next(new AppError({message: "Database connection failed", httpStatus: 500})); // Uses default internalStatus
 * next(new AppError({message: "Database connection failed", httpStatus: 500, internalStatus: 2}));
 */
export class AppError extends Error {
    message: string;
    httpStatus: number;
    internalStatus: number;
    stackTrace?: any;

    constructor({ message = "Unknown error", httpStatus = 500, internalStatus = 1, stackTrace = undefined }: AppErrorOptions = {}) {
        super(message);
        this.message = message;
        this.httpStatus = httpStatus;
        this.internalStatus = internalStatus;
        this.stackTrace = stackTrace;
    }

    toString(): string {
        return `AppError :\n\tmessage=${this.message},\n\thttpStatus=${this.httpStatus},\n\tinternalStatus=${this.internalStatus},\n\tstackTrace=${this.stackTrace}`;
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