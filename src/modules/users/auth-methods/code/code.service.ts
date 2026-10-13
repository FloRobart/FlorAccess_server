import AppConfig from "../../../../config/AppConfig";
import { User, UserLoginConfirm, UserSafe } from "../../users.types";
import { sendEmailCode } from "./code.email";
import * as CodeRepository from "./code.repository";
import * as UsersRepository from "../../users.repository";
import { getRandomValues } from "node:crypto";
import { generateApiToken, generateSecureRandomDelay, hashString, verifyHash } from "../../../../core/utils/securities";
import { generateJwt } from "../../../../core/utils/jwt";
import { UserSafeSchema } from "../../users.schema";
import logger from "../../../../core/utils/logger";
import { AppError } from "../../../../core/models/AppError.model";



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

        if (!AppConfig.app_env.includes('dev')) {
            await sendEmailCode(user.email, AppConfig.app_name, code);
        } else {
            logger.debug(`Login code for user ${user.id} is: ${code}`);
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

        if (Date.now() - timeStamp > AppConfig.token_expiration * 1000) {
            throw new AppError("Token has expired", 401);
        }

        if (user.secret_hash === null || user.token_hash === null) {
            throw new AppError("Invalid token", 401);
        }

        if (!(await verifyHash(userLoginConfirm.secret, user.secret_hash))) {
            throw new AppError("Invalid token", 401);
        }


        const loggedInUser: User = await CodeRepository.userLoginConfirm(user, userLoginConfirm.ip);
        const updatedUser: User = await closeSessionsOpenedBeforeEmailProof(user, loggedInUser);
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


/**
 * Closes the sessions opened on an account before its email address was proven for the first time.
 *
 * Anyone can register an account with an email address he does not own and get a JWT for it.
 * When the real owner of the address proves it with a login code, these earlier JWT must stop working.
 * @param userBeforeLogin The user as he was before this login.
 * @param loggedInUser The user returned by the login confirmation.
 * @returns The user to use to generate the JWT of this login.
 */
async function closeSessionsOpenedBeforeEmailProof(userBeforeLogin: User, loggedInUser: User): Promise<User> {
    if (userBeforeLogin.is_verified_email) { return loggedInUser; }

    return await UsersRepository.invalidateUserSessions(loggedInUser.id);
}
