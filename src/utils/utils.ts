import { randomBytes } from "node:crypto";
import config from "../config/config";


/**
 * Generates a random token of specified length.
 * @param {number} userId - The ID of the user to include in the token.
 * @param {number} [length] - The length of the token to generate.
 * @returns {string} A hexadecimal string representing the token.
 */
export function generateToken(userId: number, length=config.token_length): string {
    return Buffer.from(randomBytes(length)).toString('hex') + "." + (Date.now() + (config.token_expiration * 1000)) + "." + userId;
}


/**
 * Validates if the provided email address is in a valid format.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}


/**
 * Validates if the request body contains all required fields and they are not empty.
 * @param {any} body - The request body to validate.
 * @param {string[]} requiredFields - An array of required field names.
 * @returns {boolean} True if the body is valid, false otherwise.
 */
export function isValidRequestBody(body: any, requiredFields: string[]): boolean {
    if (typeof body !== 'object' || body === null) {
        return false;
    }

    for (const requiredField of requiredFields) {
        if (!body.hasOwnProperty(requiredField)) {
            return false;
        }

        let verifiedField: any = body[requiredField];
        if (Array.isArray(verifiedField)) {
            if (verifiedField.length !== 0) {
                verifiedField = verifiedField[verifiedField.length - 1]; // Get the last element of the array
            } else {
                return false;
            }
        }
        
        if (!isValidType(verifiedField)) {
            return false;
        }
        
        if (verifiedField.toString().trim() === '') {
            return false;
        }
    }

    return true;
}


function isValidType(value: any): boolean {
    return value !== undefined && value !== null && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean');
}