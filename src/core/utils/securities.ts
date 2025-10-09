import argon2 from 'argon2';
import config from '../../config/config';
import { User } from '../../modules/users/users.types';
import JWT from 'jsonwebtoken';
import { getUserByEmail } from '../../modules/users/users.repository';
import { getRandomValues, randomBytes } from "node:crypto";




/**
 * Generates a JWT for a user.
 * @param user User object to generate JWT for
 * @returns JWT as a string
 */
export async function generateJwt(user: User): Promise<string> {
    try {
        if (!user || !user.id || !user.email || !user.pseudo) {
            throw new Error('Invalid user object for JWT generation.');
        }

        const jwtPayload = {
            user_id: user.id,
            email: user.email,
            pseudo: user.pseudo,
            is_connected: user.is_connected,
            last_login: user.last_login,
        };

        return JWT.sign(jwtPayload, config.jwt_signing_key, { expiresIn: config.jwt_expiration });
    } catch (error) {
        throw error;
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
            timeCost: config.hash_rounds, // Nombre d'itérations
            parallelism: 1, // Nombre de threads
        });

        return hash;
    } catch (err) {
        throw err;
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
    } catch (err) {
        throw err;
    }
}


/**
 * Verifies a JWT and returns the user information.
 * @param token JWT to verify
 * @returns A promise that resolves to the user object if the token is valid, or null if invalid.
 */
export async function verifyJwt(jwt: string): Promise<User | null> {
    try {
        const decoded = JWT.verify(jwt, config.jwt_signing_key) as { userid: number; email: string; name: string; authmethod: string };
        if (!decoded || !decoded.userid || !decoded.email) {
            return null;
        }

        const user = await getUserByEmail(decoded.email);
        if (user && user.id === decoded.userid && user.pseudo === decoded.name) {
            return user;
        }

        return null;
    } catch (err) {
        throw err;
    }
}



/**
 * Generates a secure random delay.
 * @param maxDelayMs Maximum delay in milliseconds (default is 1000ms)
 * @returns A promise that resolves after a random delay
 */
function generateSecureRandomDelay(maxDelayMs = 1000): Promise<void> {
    const randomBuffer = new Uint32Array(1);
    getRandomValues(randomBuffer);
    // On convertit le nombre aléatoire en un délai entre 0 et maxDelayMs
    const delayMs = randomBuffer[0] % (maxDelayMs + 1);
    return new Promise((resolve) => {
        setTimeout(resolve, delayMs);
    });
}


/**
 * Generates a random API token.
 * @param length Length of the token to generate
 * @returns A hexadecimal string representing the token.
 */
export async function generateApiToken(length = 128): Promise<string> {
    await generateSecureRandomDelay();
    return Buffer.from(randomBytes(length)).toString('hex');
}

/**
 * Generates a random code.
 * @param length Length of the code to generate
 * @returns A promise that resolves to the generated code.
 */
export async function generateCode(length: number): Promise<string> {
    try {
        const chars = config.code_data_set;
        const charsLength = chars.length;
        const maxRandomValue = 0xFFFFFFFF; // Valeur max d'un Uint32
        const mask = Math.floor(maxRandomValue / charsLength) * charsLength;
        let result = '';
        const values = new Uint32Array(length);

        while (result.length < length) {
            getRandomValues(values);
            for (let i = 0; i < values.length && result.length < length; i++) {
                // On rejette les valeurs qui introduiraient un biais
                const randomValue = values[i];
                if (randomValue < mask) {
                    result += chars[randomValue % charsLength];
                }
            }
        }

        await generateSecureRandomDelay();
        return result;
    } catch (err) {
        throw err;
    }
}