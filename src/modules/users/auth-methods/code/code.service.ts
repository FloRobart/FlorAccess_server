import config from "../../../../config/config";
import { User, UserLoginConfirm, UserSafe } from "../../users.types";
import { sendEmailCode } from "./code.email";
import * as CodeRepository from "./code.repository";
import { getRandomValues, randomBytes } from "node:crypto";
import { generateSecureRandomDelay, hashString, verifyHash } from "../../../../core/utils/securities";
import { generateJwt } from "../../../../core/utils/jwt";
import { UserSafeSchema } from "../../users.schema";
import { ENABLE_ENV } from "../../../../config/enableenv";
import * as logger from "../../../../core/utils/logger";



/**
 * Generates a login request for a user using email code authentication.
 * @param user The user object containing the information of the user.
 * @returns Token to give when confirming connection
 */
export async function usersLoginRequest(user: User): Promise<string> {
    try {
        const token = await generateApiToken() + "." + Date.now();
        const code = await generateCode(6);

        await CodeRepository.userLoginRequest(user, await hashString(token), await hashString(code));

        if (ENABLE_ENV[config.app_env] !== 5) {
            await sendEmailCode(user.email, config.app_name, code);
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
        const timeStamp = parseInt(userLoginConfirm.token.split(".")[1], 10);

        if (Date.now() - timeStamp > config.token_expiration * 1000) {
            throw new Error("Token has expired");
        }

        if (!(await verifyHash(userLoginConfirm.secret, user.secret_hash!))) {
            throw new Error("Invalid token");
        }


        const updatedUser: User = await CodeRepository.userLoginConfirm(user, userLoginConfirm.ip);
        const userSafe: UserSafe = UserSafeSchema.parse(updatedUser);

        return generateJwt(userSafe);
    } catch (error) {
        throw error;
    }
}


/**
 * Generates a random code.
 * @param length Length of the code to generate
 * @returns A promise that resolves to the generated code.
 */
async function generateCode(length: number): Promise<string> {
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


/**
 * Generates a random API token.
 * @param length Length of the token to generate
 * @returns A hexadecimal string representing the token.
 */
async function generateApiToken(length = config.token_length): Promise<string> {
    await generateSecureRandomDelay();
    return Buffer.from(randomBytes(length)).toString('hex');
}