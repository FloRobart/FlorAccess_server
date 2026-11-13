import argon2 from 'argon2';
import AppConfig from '../../config/AppConfig';
import { createHmac, getRandomValues, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from '../models/AppError.model';



/* The hashes made by Argon2 start with this prefix, the HMAC hashes are only hexadecimal */
const ARGON2_HASH_PREFIX = "$argon2";

/**
 * Key of the token hashes, derived from the JWT signing key so that no other secret has to be managed.
 * The derivation keeps the two uses apart: the JWT signing key itself never hashes a token.
 * Changing the JWT signing key also invalidates the links and codes waiting to be used.
 */
const TOKEN_HASH_KEY: Buffer = Buffer.from(hkdfSync('sha256', AppConfig.jwt_signing_key, '', 'floraccess token hash', 32));



/**
 * Generates a secure random delay.
 * @param maxDelayMs Maximum delay in milliseconds (default is 1000ms)
 * @returns A promise that resolves after a random delay
 */
export function generateSecureRandomDelay(maxDelayMs = 1000): Promise<void> {
    try {
        const randomBuffer = new Uint32Array(1);
        getRandomValues(randomBuffer);
        const delayMs = randomBuffer[0] % (maxDelayMs + 1);
        return new Promise((resolve) => {
            setTimeout(resolve, delayMs);
        });
    } catch (error) {
        return Promise.resolve();
    }
}


/**
 * Generates a random API token.
 * @param length Length of the token to generate
 * @returns A hexadecimal string representing the token.
 * @throws AppError if token generation fails.
 */
export async function generateApiToken(length = AppConfig.token_length): Promise<string> {
    try {
        await generateSecureRandomDelay();
        return Buffer.from(randomBytes(length)).toString('hex');
    } catch (error) {
        throw new AppError("Failed to generate API token", 500);
    }
}


/**
 * Hashes a string using Argon2.
 * @param input String to hash
 * @returns A promise that resolves to the hashed string.
 */
export async function hashString(input: string): Promise<string> {
    try {
        const hash = await argon2.hash(input, {
            type: argon2.argon2id, // Résistant aux attaques GPU/ASIC
            timeCost: AppConfig.hash_rounds, // Nombre d'itérations
            parallelism: 1, // Nombre de threads
        });

        return hash;
    } catch (error) {
        throw error;
    }
}


/**
 * Verifies a hashed string against a plain text input.
 * @param input String to verify
 * @param hash Hashed string to compare against
 * @returns A promise that resolves to a boolean indicating if the hash matches the input.
 */
export async function verifyHash(input: string, hash: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, input);
    } catch (error) {
        throw error;
    }
}


/**
 * Hashes a random token (email verification, login request, login block) to store it in the database.
 *
 * These tokens are long and random: unlike a password or a short code, they can not be guessed,
 * so a fast keyed hash (HMAC-SHA256) protects them as well as Argon2 would.
 * Argon2 made each request cost a lot of processor time, which anyone could use to overload the server.
 * The key keeps a stolen database from being enough to try to guess the tokens.
 * @param token Token to hash
 * @returns The hash of the token, in hexadecimal
 */
export function hashToken(token: string): string {
    return createHmac('sha256', TOKEN_HASH_KEY).update(token).digest('hex');
}


/**
 * Checks a token against the hash stored in the database, in constant time.
 *
 * The tokens stored before the use of HMAC have an Argon2 hash: they are still checked with Argon2,
 * so that the links and the codes sent before this change keep working.
 * @param token Token to check
 * @param storedHash Hash stored in the database
 * @returns True if the token matches the hash
 */
export async function verifyToken(token: string, storedHash: string): Promise<boolean> {
    if (storedHash.startsWith(ARGON2_HASH_PREFIX)) { return await verifyHash(token, storedHash); }

    const tokenHash = Buffer.from(hashToken(token), 'hex');
    const expectedHash = Buffer.from(storedHash, 'hex');
    if (tokenHash.length !== expectedHash.length) { return false; }

    return timingSafeEqual(tokenHash, expectedHash);
}