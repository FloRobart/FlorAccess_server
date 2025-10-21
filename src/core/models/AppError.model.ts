/**
 * AppError model to represent application errors with HTTP status codes.
 */
export class AppError extends Error {
    message: string;
    httpStatus: number;

    constructor(message?: string, httpStatus?: number) {
        super(message);
        this.message = message || "Internal Server Error";
        this.httpStatus = httpStatus || 500;
    }
}