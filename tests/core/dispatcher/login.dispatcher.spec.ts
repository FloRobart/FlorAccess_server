import type { AuthMethod } from "../../../src/modules/users/auth-methods/auth_methods.types";
import type { UserLoginConfirm, UserLoginRequest } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginDispatcher } from "../../../src/core/dispatcher/login.dispatcher";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as AuthMethodsRepository from "../../../src/modules/users/auth-methods/auth_methods.repository";
import { usersLoginConfirm, usersLoginRequest } from "../../../src/modules/users/auth-methods/code/code.service";
import { usersLoginConfirmPassword, usersLoginRequestPassword } from "../../../src/modules/users/auth-methods/password/password.service";
import { buildUser } from "../../modules/users/users.fixtures";



/* The database and the authentication methods are replaced, only the rules of the dispatcher are tested */
vi.mock("../../../src/modules/users/users.repository", () => ({
    _getUserByEmail: vi.fn(),
}));

vi.mock("../../../src/modules/users/auth-methods/auth_methods.repository", () => ({
    _getAuth_methodsById: vi.fn(),
}));

vi.mock("../../../src/modules/users/auth-methods/code/code.service", () => ({
    usersLoginRequest: vi.fn(),
    usersLoginConfirm: vi.fn(),
}));

vi.mock("../../../src/modules/users/auth-methods/password/password.service", () => ({
    usersLoginRequestPassword: vi.fn(),
    usersLoginConfirmPassword: vi.fn(),
}));



/**
 * Login dispatcher tests
 */
describe('Login dispatcher', () => {
    beforeEach(() => {
        vi.mocked(AuthMethodsRepository._getAuth_methodsById).mockResolvedValue(EmailCodeAuthMethod);
        vi.mocked(usersLoginRequest).mockResolvedValue(LoginToken);
    });


    /*=============*/
    /* Login block */
    /*=============*/
    describe('Login block', () => {
        it('Dispatches the login of a user who never blocked his logins', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(buildUser());

            await expect(loginDispatcher(LoginRequest)).resolves.toBe(LoginToken);
        });

        it('Rejects the login of a user whose logins are blocked', async () => {
            const blockedUser = buildUser({ login_blocked_until: new Date(Date.now() + OneHour) });
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(blockedUser);

            await expect(loginDispatcher(LoginRequest)).rejects.toMatchObject({ httpStatus: 403 });
            expect(usersLoginRequest).not.toHaveBeenCalled();
        });

        it('Dispatches the login of a user whose block is over', async () => {
            const userAfterBlock = buildUser({ login_blocked_until: new Date(Date.now() - OneHour) });
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(userAfterBlock);

            await expect(loginDispatcher(LoginRequest)).resolves.toBe(LoginToken);
        });
    });


    /*==============*/
    /* Unknown user */
    /*==============*/
    describe('Unknown user', () => {
        it('Rejects the login of an email which belongs to no user', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);

            await expect(loginDispatcher(LoginRequest)).rejects.toMatchObject({ httpStatus: 404 });
            expect(AuthMethodsRepository._getAuth_methodsById).not.toHaveBeenCalled();
        });
    });


    /*=======================*/
    /* Authentication method */
    /*=======================*/
    describe('Authentication method', () => {
        beforeEach(() => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(buildUser());
        });

        it('Sends the confirmation of an email code login to the code method', async () => {
            vi.mocked(usersLoginConfirm).mockResolvedValue(SignedJwt);

            await expect(loginDispatcher(LoginConfirm)).resolves.toBe(SignedJwt);
            expect(usersLoginConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), LoginConfirm);
        });

        it('Sends the request of a password login to the password method', async () => {
            vi.mocked(AuthMethodsRepository._getAuth_methodsById).mockResolvedValue(PasswordAuthMethod);
            vi.mocked(usersLoginRequestPassword).mockResolvedValue(LoginToken);

            await expect(loginDispatcher(LoginRequest)).resolves.toBe(LoginToken);
            expect(usersLoginRequestPassword).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
        });

        it('Sends the confirmation of a password login to the password method', async () => {
            vi.mocked(AuthMethodsRepository._getAuth_methodsById).mockResolvedValue(PasswordAuthMethod);
            vi.mocked(usersLoginConfirmPassword).mockResolvedValue(SignedJwt);

            await expect(loginDispatcher(LoginConfirm)).resolves.toBe(SignedJwt);
        });

        it('Rejects an authentication method which does not exist', async () => {
            vi.mocked(AuthMethodsRepository._getAuth_methodsById).mockResolvedValue({ ...EmailCodeAuthMethod, immuable_method_name: "UNKNOWN" });

            await expect(loginDispatcher(LoginRequest)).rejects.toMatchObject({ httpStatus: 400 });
        });

        it('Rejects a login which is neither a request nor a confirmation', async () => {
            const invalidLogin = { email: "not-an-email" } as UserLoginRequest;

            await expect(loginDispatcher(invalidLogin)).rejects.toMatchObject({ httpStatus: 400 });

            vi.mocked(AuthMethodsRepository._getAuth_methodsById).mockResolvedValue(PasswordAuthMethod);
            await expect(loginDispatcher(invalidLogin)).rejects.toMatchObject({ httpStatus: 400 });
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneHour: number = 60 * 60 * 1000;
const LoginToken: string = "login-token";
const SignedJwt: string = "signed-jwt";

const LoginRequest: UserLoginRequest = {
    email: "test1@test.fr",
};

const LoginConfirm: UserLoginConfirm = {
    email: "test1@test.fr",
    token: LoginToken,
    secret: "123456",
    ip: null,
};

const EmailCodeAuthMethod: AuthMethod = {
    id: 1,
    immuable_method_name: "EMAIL_CODE",
    display_name: "Code",

    created_at: new Date(),
    updated_at: new Date(),
};

const PasswordAuthMethod: AuthMethod = {
    ...EmailCodeAuthMethod,
    id: 2,
    immuable_method_name: "PASSWORD",
    display_name: "Password",
};
