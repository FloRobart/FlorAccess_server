import config from '../../config/config';
import JWT from 'jsonwebtoken';



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