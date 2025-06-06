import { randomBytes } from "node:crypto";


/**
 * Generates a random token of specified length.
 * @param {number} [length=56] - The length of the token to generate. (default 56)
 * @returns {string} A hexadecimal string representing the token.
 */
export function generateToken(length=56): string {
    return Buffer.from(randomBytes(length)).toString('hex');
}