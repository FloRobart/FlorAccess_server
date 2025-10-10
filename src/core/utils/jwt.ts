import config from '../../config/config';
import JWT from 'jsonwebtoken';
import { UserSafe } from '../../modules/users/users.types';



/**
 * Generates a JWT for a user.
 * @param user User object to generate JWT for
 * @returns JWT as a string
 */
export async function generateJwt(payload: { [key: string|number]: any }): Promise<string> {
    try {
        const validatedPayload = payload || {};
        return JWT.sign(validatedPayload, config.jwt_signing_key, { expiresIn: config.jwt_expiration });
    } catch (error) {
        throw error;
    }
}

/**
 * Verifies and decodes a JWT token.
 * @param token JWT token to verify
 * @returns Decoded JWT payload or null if invalid
 */
export async function verifyJwt(token: string): Promise<UserSafe> {
    try {
        const decoded = JWT.verify(token, config.jwt_signing_key);
        return decoded as UserSafe;
    } catch (error) {
        throw error;
    }
}