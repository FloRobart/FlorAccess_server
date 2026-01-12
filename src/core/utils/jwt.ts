import AppConfig from '../../config/AppConfig';
import JWT from 'jsonwebtoken';
import { UserSafe } from '../../modules/users/users.types';
import { AppError } from '../models/AppError.model';



/**
 * Generates a JWT for a user.
 * @param user User object to generate JWT for
 * @returns JWT as a string
 */
export async function generateJwt(payload: { [key: string|number]: any }): Promise<string> {
    try {
        const validatedPayload = payload || {};
        return JWT.sign(validatedPayload, AppConfig.jwt_signing_key, { expiresIn: AppConfig.jwt_expiration });
    } catch (error) {
        throw new AppError("Failed to generate JWT", 500);
    }
}

/**
 * Verifies and decodes a JWT token.
 * @param token JWT token to verify
 * @returns Decoded JWT payload or null if invalid
 */
export function verifyJwt(token: string): UserSafe {
    try {
        const decoded = JWT.verify(token, AppConfig.jwt_signing_key);
        return decoded as UserSafe;
    } catch (error) {
        throw new AppError("Invalid JWT", 401);
    }
}