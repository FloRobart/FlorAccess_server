import AppConfig from '../../config/AppConfig';
import JWT from 'jsonwebtoken';
import { UserSafe } from '../../modules/users/users.types';
import { AppError } from '../models/AppError.model';



/**
 * Generates a JWT for a user.
 * @param payload User object to generate JWT for
 * @param sessionStartedAt Date of the login which opened the session, in milliseconds. A regenerated JWT must keep the date of its original login.
 * @returns JWT as a string
 */
export async function generateJwt(payload: { [key: string|number]: any }, sessionStartedAt: number = Date.now()): Promise<string> {
    try {
        const validatedPayload = { ...payload, session_started_at: sessionStartedAt };
        return JWT.sign(validatedPayload, AppConfig.jwt_signing_key, { expiresIn: AppConfig.jwt_expiration });
    } catch (error) {
        throw new AppError("Failed to generate JWT", 500);
    }
}


/**
 * Generates a new JWT which continues the session of a current JWT.
 *
 * The new JWT keeps the date of the original login, so that regenerating a JWT again and again can not extend a session forever :
 * after the maximum session duration, the user has to log in again.
 * @param currentToken JWT of the session to continue
 * @param payload User object to generate the new JWT for
 * @returns New JWT as a string
 * @throws AppError if the current JWT is invalid or if its session is older than the maximum session duration
 */
export async function renewJwt(currentToken: string, payload: { [key: string|number]: any }): Promise<string> {
    const sessionStartedAt = getSessionStartDate(currentToken);

    const sessionAge = Date.now() - sessionStartedAt;
    if (sessionAge > AppConfig.session_max_duration) {
        throw new AppError("Session expired, please log in again", 401);
    }

    return generateJwt(payload, sessionStartedAt);
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


/**
 * Checks if a JWT belongs to a session which was closed by a logout.
 *
 * A JWT carries the date of the last logout of its user at the time it was issued :
 * when the user logs out, this date changes in the database and the JWT issued before must not be accepted anymore.
 * The dates are compared to the second, like the queries which check this same date.
 * @param jwtUser User decoded from the JWT
 * @param lastLogoutAt Date of the last logout of the user, read from the database
 * @returns True if the user logged out since the JWT was issued
 */
export function isJwtFromClosedSession(jwtUser: UserSafe, lastLogoutAt: Date): boolean {
    const millisecondsPerSecond = 1000;
    const jwtLastLogoutInSeconds = Math.floor(new Date(jwtUser.last_logout_at).getTime() / millisecondsPerSecond);
    const lastLogoutInSeconds = Math.floor(lastLogoutAt.getTime() / millisecondsPerSecond);

    return jwtLastLogoutInSeconds !== lastLogoutInSeconds;
}


/**
 * Reads the date of the login which opened the session of a JWT.
 * @param token JWT token of the session
 * @returns Date of the login, in milliseconds
 * @throws AppError if the JWT is invalid
 */
function getSessionStartDate(token: string): number {
    const decoded = verifyJwt(token) as UserSafe & { session_started_at?: unknown, iat?: number };
    if (typeof decoded.session_started_at === "number") { return decoded.session_started_at; }

    /* The JWT issued before this date existed do not carry it : their session is considered to start when they were issued */
    const millisecondsPerSecond = 1000;
    return (decoded.iat ?? 0) * millisecondsPerSecond;
}
