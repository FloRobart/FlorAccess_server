/**
 * Custom Error interface to include HTTP status codes
 * @param message Error message
 * @param httpStatus HTTP status code
 */
export class AppError extends Error {
    httpStatus: number;

    constructor(message: string = "Internal Server Error", httpStatus: number = 500) {
        super(message);
        this.httpStatus = httpStatus;
    }
}