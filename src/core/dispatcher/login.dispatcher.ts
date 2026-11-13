import { UserLoginRequest, User, UserLoginConfirm } from "../../modules/users/users.types";
import * as UsersRepository from "../../modules/users/users.repository";
import * as AuthMethodsRepository from "../../modules/users/auth-methods/auth_methods.repository";
import { AppError } from "../models/AppError.model";
import { INVALID_LOGIN_TOKEN_MESSAGE, usersLoginConfirm, usersLoginRequest } from "../../modules/users/auth-methods/code/code.service";
import { usersLoginConfirmPassword, usersLoginRequestPassword } from "../../modules/users/auth-methods/password/password.service";
import { UserLoginConfirmSchema, UserLoginRequestSchema } from "../../modules/users/users.schema";



/**
 * Dispatches the login request for a user.
 *
 * A confirmation answers the same way for an unknown email address as for a wrong token, and does not tell either
 * if the logins of the account are blocked: anyone can send a confirmation for any address, it must not reveal
 * which accounts exist. A blocked account has no pending login code anyway, so its confirmations always fail.
 * @param userLogin The login request user information or the login confirmation user information.
 * @returns Token to give when confirming connection
 */
export async function loginDispatcher(userLogin: UserLoginRequest | UserLoginConfirm): Promise<string> {
    try {
        const isLoginConfirmation: boolean = UserLoginConfirmSchema.safeParse(userLogin).success;

        const user: User | null = await UsersRepository._getUserByEmail(userLogin.email);
        if (!user && isLoginConfirmation) { throw new AppError(INVALID_LOGIN_TOKEN_MESSAGE, 401); }
        if (!user) { throw new AppError("User not found", 404); }
        if (!isLoginConfirmation && isUserLoginBlocked(user)) { throw new AppError("Logins are temporarily blocked for this account", 403); }

        const auth_method = await AuthMethodsRepository._getAuth_methodsById(user.auth_methods_id);

        switch (auth_method.immuable_method_name) {
            case "PASSWORD":
                if (UserLoginConfirmSchema.safeParse(userLogin).success) {
                    return await usersLoginConfirmPassword();
                } else if (UserLoginRequestSchema.safeParse(userLogin).success) {
                    return await usersLoginRequestPassword(user);
                }
            case "EMAIL_CODE":
                if (UserLoginConfirmSchema.safeParse(userLogin).success) {
                    return await usersLoginConfirm(user, userLogin as UserLoginConfirm);
                } else if (UserLoginRequestSchema.safeParse(userLogin).success) {
                    return await usersLoginRequest(user);
                }
            default:
                throw new AppError("Unsupported authentication method", 400);
        }
    } catch (error) {
        throw error;
    }
}


/**
 * Checks if the logins on the account of a user are blocked.
 *
 * The logins are blocked by the user himself from the link of a login code email,
 * or by the API after too many login codes sent without a successful login.
 * The block has an end date, so that it stops by itself without any action.
 * @param user The user who tries to log in.
 * @returns True if the logins are currently blocked for this user.
 */
function isUserLoginBlocked(user: User): boolean {
    if (user.login_blocked_until === null) { return false; }

    return user.login_blocked_until.getTime() > Date.now();
}