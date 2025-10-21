import { UserLoginRequest, User, UserLoginConfirm } from "../../modules/users/users.types";
import * as UsersRepository from "../../modules/users/users.repository";
import * as AuthMethodsRepository from "../../modules/users/auth-methods/auth_methods.repository";
import { AppError } from "../models/AppError.model";
import { usersLoginConfirm, usersLoginRequest } from "../../modules/users/auth-methods/code/code.service";
import { usersLoginConfirmPassword, usersLoginRequestPassword } from "../../modules/users/auth-methods/password/password.service";
import { UserLoginConfirmSchema, UserLoginRequestSchema } from "../../modules/users/users.schema";



/**
 * Dispatches the login request for a user.
 * @param userLogin The login request user information or the login confirmation user information.
 * @returns Token to give when confirming connection
 */
export async function loginDispatcher(userLogin: UserLoginRequest | UserLoginConfirm): Promise<string> {
    try {
        const user: User = await UsersRepository._getUserByEmail(userLogin.email);
        const auth_method = await AuthMethodsRepository._getAuth_methodsById(user.auth_methods_id);

        switch (auth_method.immuable_method_name) {
            case "PASSWORD":
                if (UserLoginConfirmSchema.safeParse(userLogin).success === true) {
                    return await usersLoginConfirmPassword();
                } else if (UserLoginRequestSchema.safeParse(userLogin).success === true) {
                    return await usersLoginRequestPassword(user);
                }
            case "EMAIL_CODE":
                if (UserLoginConfirmSchema.safeParse(userLogin).success === true) {
                    return await usersLoginConfirm(user, userLogin as UserLoginConfirm);
                } else if (UserLoginRequestSchema.safeParse(userLogin).success === true) {
                    return await usersLoginRequest(user);
                }
            default:
                throw new AppError("Unsupported authentication method", 400);
        }
    } catch (error) {
        throw error;
    }
}