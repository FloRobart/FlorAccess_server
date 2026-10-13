import AppConfig from "../../../../config/AppConfig";
import { User, UserLoginConfirm, UserSafe } from "../../users.types";
import { sendEmailCode } from "./code.email";
import * as CodeRepository from "./code.repository";
import { getRandomValues } from "node:crypto";
import { generateApiToken, generateSecureRandomDelay, hashString, verifyHash } from "../../../../core/utils/securities";
import { generateJwt } from "../../../../core/utils/jwt";
import { UserSafeSchema } from "../../users.schema";
import logger from "../../../../core/utils/logger";
import { AppError } from "../../../../core/models/AppError.model";



const LOGIN_REQUEST_COOLDOWN_MESSAGE = "A login code was sent recently. Please wait before requesting a new one";



/**
 * Generates a login request for a user using email code authentication.
 * @param user The user object containing the information of the user.
 * @returns Token to give when confirming connection
 */
export async function usersLoginRequest(user: User): Promise<string> {
    try {
        /* Early refusal which avoids the cost of the hashes, the query below is the one which enforces the cooldown. */
        if (isLoginRequestInCooldown(user)) {
            throw new AppError(LOGIN_REQUEST_COOLDOWN_MESSAGE, 429);
        }

        /* Generated and hashed together, because each of these steps is slow on purpose */
        const [token, blockToken, code] = await Promise.all([generateApiToken(), generateApiToken(), generateCode(6)]);
        const [tokenHash, blockTokenHash, codeHash] = await Promise.all([hashString(token), hashString(blockToken), hashString(code)]);

        const isLoginCodeStored = await CodeRepository.userLoginRequest(user, tokenHash, codeHash, blockTokenHash, AppConfig.login_request_cooldown);
        if (!isLoginCodeStored) {
            throw new AppError(LOGIN_REQUEST_COOLDOWN_MESSAGE, 429);
        }

        const loginBlockUrl = `${AppConfig.base_url}/users/login/block/${user.id}?token=${blockToken}`;
        logger.debug(`Login block URL for user ${user.id}: ${loginBlockUrl}`);

        if (!AppConfig.app_env.includes('dev')) {
            await sendEmailCode(user.email, AppConfig.app_name, code, loginBlockUrl);
        } else {
            logger.debug(`Login code for user ${user.id} is: ${code}`);
            logger.debug(`Login block URL for user ${user.id}: ${loginBlockUrl}`);
        }

        return token;
    } catch (error) {
        throw error;
    }
}


/**
 * Generates a login confirmation for a user using email code authentication.
 * @param user The user object containing the information of the user.
 * @returns JWT for the authenticated user.
 */
export async function usersLoginConfirm(user: User, userLoginConfirm: UserLoginConfirm): Promise<string> {
    try {
        if (user.secret_hash === null || user.token_hash === null || user.login_requested_at === null) {
            throw new AppError("Invalid token", 401);
        }

        if (isLoginCodeExpired(user.login_requested_at)) {
            throw new AppError("Token has expired", 401);
        }

        /* The token proves that the confirmation comes from the device which requested the code. */
        /* It is checked before an attempt is counted, so that a third party can not use up the attempts of the user. */
        if (!(await verifyHash(userLoginConfirm.token, user.token_hash))) {
            throw new AppError("Invalid token", 401);
        }

        const hasAttemptLeft = await CodeRepository.consumeLoginCodeAttempt(user.id, user.token_hash, AppConfig.login_code_max_attempts);
        if (!hasAttemptLeft) {
            throw new AppError("Too many attempts. Please request a new code", 429);
        }

        if (!(await verifyHash(userLoginConfirm.secret, user.secret_hash))) {
            throw new AppError("Invalid token", 401);
        }


        const updatedUser: User = await CodeRepository.userLoginConfirm(user, userLoginConfirm.ip);
        const userSafe: UserSafe = UserSafeSchema.parse(updatedUser);

        return generateJwt(userSafe);
    } catch (error) {
        throw error;
    }
}


/**
 * Checks if a login code is pending and was sent too recently to send another one.
 *
 * Without this delay, the limit of attempts per code could be bypassed by requesting new codes in a loop.
 * A code which was already used does not start a cooldown, so that a user can log in again right after a logout.
 * @param user The user who requests a new login code.
 * @returns True if the user has to wait before requesting a new code.
 */
function isLoginRequestInCooldown(user: User): boolean {
    if (user.secret_hash === null || user.login_requested_at === null) { return false; }

    const timeSinceLastRequest = Date.now() - user.login_requested_at.getTime();
    return timeSinceLastRequest < AppConfig.login_request_cooldown;
}


/**
 * Checks if a login code is too old to be used.
 *
 * The age is computed from the date stored in the database, never from a value sent by the client.
 * @param loginRequestedAt Date when the login code was sent.
 * @returns True if the login code has expired.
 */
function isLoginCodeExpired(loginRequestedAt: Date): boolean {
    const loginCodeAge = Date.now() - loginRequestedAt.getTime();
    return loginCodeAge > AppConfig.token_expiration;
}


/**
 * Generates a random code.
 * @param length Length of the code to generate
 * @returns A promise that resolves to the generated code.
 */
async function generateCode(length: number): Promise<string> {
    try {
        const chars = AppConfig.code_data_set;
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
    } catch (error) {
        throw error;
    }
}
