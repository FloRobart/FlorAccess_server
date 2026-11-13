import { describe, it, expect } from "vitest";
import { AppError } from "../../../src/core/models/AppError.model";



/**
 * Application error tests
 */
describe('Application error', () => {
    it('Is an internal server error by default', () => {
        const error = new AppError();

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Internal Server Error");
        expect(error.httpStatus).toBe(500);
    });

    it('Keeps the message and the HTTP status it is given', () => {
        const error = new AppError("User not found", 404);

        expect(error.message).toBe("User not found");
        expect(error.httpStatus).toBe(404);
    });
});
