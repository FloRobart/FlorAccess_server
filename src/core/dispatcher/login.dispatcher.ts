import { UserLoginRequest, User } from "../../modules/users/users.types";
import * as UsersRepository from "../../modules/users/users.repository";
import * as AuthMethodsRepository from "../../modules/users/auth-methods/auth_methods.repository";
import { AppError } from "../models/ErrorModel";
import { usersLoginRequestCode } from "../../modules/users/auth-methods/code/code.service";
import { usersLoginRequestPassword } from "../../modules/users/auth-methods/password/password.service";



/**
 * Dispatches the login request for a user.
 * @param userLoginRequest The login request user information.
 * @returns Token to give when confirming connection
 */
export async function loginRequestDispatcher(userLoginRequest: UserLoginRequest): Promise<string> {
    try {
        const user: User = await UsersRepository._getUserByEmail(userLoginRequest);
        const auth_method = await AuthMethodsRepository._getAuth_methodsById(user.auth_methods_id);

        switch (auth_method.immuable_method_name) {
            case "PASSWORD":
                return await usersLoginRequestPassword(user);
            case "EMAIL_CODE":
                return await usersLoginRequestCode(user);
            default:
                throw new AppError({ message: "Unsupported authentication method", httpStatus: 400 });
        }
    } catch (error) {
        throw error;
    }
}