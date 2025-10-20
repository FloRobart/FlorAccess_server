import config from "../../../../config/config";
import { User, UserLoginConfirm, UserSafe } from "../../users.types";
import { sendEmailCode } from "./code.email";
import * as CodeRepository from "./code.repository";
import { getRandomValues, randomBytes } from "node:crypto";
import { generateSecureRandomDelay, hashString } from "../../../../core/utils/securities";
import { generateJwt } from "../../../../core/utils/jwt";
import { UserSafeSchema } from "../../users.schema";



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
        await sendEmailCode(user.email, config.app_name, code);
    
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
        const updatedUser: User = await CodeRepository.userLoginConfirm(user, userLoginConfirm);
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
async function generateApiToken(length = 128): Promise<string> {
    await generateSecureRandomDelay();
    return Buffer.from(randomBytes(length)).toString('hex');
}