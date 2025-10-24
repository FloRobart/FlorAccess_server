import argon2 from 'argon2';
import AppConfig from '../../config/AppConfig';
import { getRandomValues, randomBytes } from "node:crypto";
import { AppError } from '../models/AppError.model';



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