import type { AuthMethod } from "../../../src/modules/users/auth-methods/auth_methods.types";
import type { UserLoginRequest } from "../../../src/modules/users/users.types";

import { loginDispatcher } from "../../../src/core/dispatcher/login.dispatcher";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as AuthMethodsRepository from "../../../src/modules/users/auth-methods/auth_methods.repository";
import { usersLoginRequest } from "../../../src/modules/users/auth-methods/code/code.service";
import { buildUser } from "../../modules/users/users.fixtures";



/* The database and the authentication methods are replaced, only the rules of the dispatcher are tested */
jest.mock("../../../src/modules/users/users.repository", () => ({
    _getUserByEmail: jest.fn(),
}));

jest.mock("../../../src/modules/users/auth-methods/auth_methods.repository", () => ({
    _getAuth_methodsById: jest.fn(),
}));

jest.mock("../../../src/modules/users/auth-methods/code/code.service", () => ({
    usersLoginRequest: jest.fn(),
    usersLoginConfirm: jest.fn(),
}));

jest.mock("../../../src/modules/users/auth-methods/password/password.service", () => ({
    usersLoginRequestPassword: jest.fn(),
    usersLoginConfirmPassword: jest.fn(),
}));



/**
 * Login dispatcher tests
 */
describe('Login dispatcher', () => {
    beforeEach(() => {
        jest.mocked(AuthMethodsRepository._getAuth_methodsById).mockResolvedValue(EmailCodeAuthMethod);
        jest.mocked(usersLoginRequest).mockResolvedValue(LoginToken);
    });


    /*=============*/
    /* Login block */
    /*=============*/
    describe('Login block', () => {
        it('Dispatches the login of a user who never blocked his logins', async () => {
            jest.mocked(UsersRepository._getUserByEmail).mockResolvedValue(buildUser());

            await expect(loginDispatcher(LoginRequest)).resolves.toBe(LoginToken);
        });

        it('Rejects the login of a user whose logins are blocked', async () => {
            const blockedUser = buildUser({ login_blocked_until: new Date(Date.now() + OneHour) });
            jest.mocked(UsersRepository._getUserByEmail).mockResolvedValue(blockedUser);

            await expect(loginDispatcher(LoginRequest)).rejects.toMatchObject({ httpStatus: 403 });
            expect(usersLoginRequest).not.toHaveBeenCalled();
        });

        it('Dispatches the login of a user whose block is over', async () => {
            const userAfterBlock = buildUser({ login_blocked_until: new Date(Date.now() - OneHour) });
            jest.mocked(UsersRepository._getUserByEmail).mockResolvedValue(userAfterBlock);

            await expect(loginDispatcher(LoginRequest)).resolves.toBe(LoginToken);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneHour: number = 60 * 60 * 1000;
const LoginToken: string = "login-token";

const LoginRequest: UserLoginRequest = {
    email: "test1@test.fr",
};

const EmailCodeAuthMethod: AuthMethod = {
    id: 1,
    immuable_method_name: "EMAIL_CODE",
    display_name: "Code",

    created_at: new Date(),
    updated_at: new Date(),
};
