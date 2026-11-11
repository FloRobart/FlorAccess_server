import type { User, UserLoginBlock, UserLoginConfirm, UserSafe } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import AppConfig from "../../../src/config/AppConfig";
import { blockUserLogin, deleteExpiredUnverifiedUsers, deleteUser, getUserLoginBlockPage, insertUser, logoutUser, NEW_ACCOUNT_LIMIT_REACHED_MESSAGE, regenerateJwt, selectUser, sendVerificationEmail, UNVERIFIED_USER_RETENTION_IN_MONTHS, updateUser, UserEmailVerify, userLoginConfirm, userLoginRequest } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import * as Jwt from "../../../src/core/utils/jwt";
import { loginDispatcher } from "../../../src/core/dispatcher/login.dispatcher";
import { sendEmailVerify } from "../../../src/modules/users/users.email";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";
import logger from "../../../src/core/utils/logger";
import { AppError } from "../../../src/core/models/AppError.model";
import { assertEmailCanBeSent } from "../../../src/core/email/mailer";
import { buildUser } from "./users.fixtures";



/* The emails are only sent outside of the development environment : each test chooses its own */
const { mockedAppConfig } = vi.hoisted(() => ({
    mockedAppConfig: {
        app_env: "dev",
        app_name: "Floraccess",
        base_url: "http://localhost",
        login_block_duration: 24 * 60 * 60 * 1000,
        new_account_daily_limit: 2,
        corsOptions: { origin: ["https://econoris.fr"] },
    },
}));

vi.mock("../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));

/* The database, the hashing, the emails and the HTML pages are replaced, only the rules of the service are tested */
vi.mock("../../../src/modules/users/users.repository", () => ({
    _getUserById: vi.fn(),
    _getUserByEmail: vi.fn(),
    blockUserLogin: vi.fn(),
    insertUser: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserWithUnverifiedEmail: vi.fn(),
    deleteUser: vi.fn(),
    logoutUser: vi.fn(),
    UserEmailVerify: vi.fn(),
    deleteUnverifiedUsersCreatedBefore: vi.fn(),
}));

vi.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    hashString: vi.fn(),
    verifyHash: vi.fn(),
    hashToken: vi.fn(),
    verifyToken: vi.fn(),
}));

/* The daily limit of emails is tested with the mailer, each test here chooses if it is reached */
vi.mock("../../../src/core/email/mailer", () => ({
    assertEmailCanBeSent: vi.fn(),
}));

vi.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: vi.fn(),
}));

vi.mock("../../../src/core/dispatcher/login.dispatcher", () => ({
    loginDispatcher: vi.fn(),
}));

vi.mock("../../../src/modules/users/users.email", () => ({
    sendEmailVerify: vi.fn(),
}));

vi.mock("../../../src/core/utils/jwt", () => ({
    generateJwt: vi.fn(),
    renewJwt: vi.fn(),
    verifyJwt: vi.fn(),
}));

vi.mock("../../../src/core/utils/logger", () => ({
    default: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));



/**
 * Users service tests
 */
describe('Users service', () => {
    /* Only the date is faked: the daily limit counts the accounts created during the last 24 hours */
    vi.useFakeTimers({ toFake: ['Date'] });

    beforeEach(() => {
        mockedAppConfig.app_env = "dev";
        vi.mocked(Securities.hashToken).mockImplementation((input: string) => fakeHash(input));
        vi.mocked(Securities.verifyToken).mockImplementation(async (input: string, hash: string) => hash === fakeHash(input));
        vi.mocked(UsersRepository.blockUserLogin).mockResolvedValue(true);

        /* Each test starts one day after the previous one, so that the accounts of the other tests do not count anymore */
        vi.setSystemTime(Date.now() + OneDay);

        /* The page is reduced to its status, which is enough to know which page was returned */
        vi.mocked(getEmailTemplate).mockImplementation(async (_templateName: string, variables: Record<string, string>) => variables.status);
    });

    afterAll(() => {
        vi.useRealTimers();
    });


    /*=============*/
    /* Login block */
    /*=============*/
    describe('Login block', () => {
        it('Displays the email of the account on the confirmation page when the token is correct', async () => {
            const user: User = buildUser({ login_block_token_hash: fakeHash(BlockToken) });
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(user);

            await getUserLoginBlockPage(LoginBlockLink);

            expect(getEmailTemplate).toHaveBeenCalledWith('login_block_confirmation', expect.objectContaining({ email: user.email }));
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Does not reveal the email of the account with a wrong token', async () => {
            const userWithOtherBlockToken: User = buildUser({ login_block_token_hash: fakeHash("other-token") });
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(userWithOtherBlockToken);

            await expect(getUserLoginBlockPage(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(getEmailTemplate).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ email: expect.anything() }));
        });

        it('Blocks the logins without logging out when nobody used the login code', async () => {
            const userWithUnusedLoginCode: User = buildUser({
                login_block_token_hash: fakeHash(BlockToken),
                login_requested_at: new Date(),
            });
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(userWithUnusedLoginCode);

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(BlockedPageStatus);
            expect(UsersRepository.blockUserLogin).toHaveBeenCalledWith(userWithUnusedLoginCode.id, fakeHash(BlockToken), AppConfig.login_block_duration, false);
        });

        it('Blocks the logins and logs out from all devices when someone used the login code', async () => {
            const loginCodeSentAt: Date = new Date(Date.now() - OneMinute);
            const userWithUsedLoginCode: User = buildUser({
                login_block_token_hash: fakeHash(BlockToken),
                login_requested_at: loginCodeSentAt,
                last_login: new Date(),
            });
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(userWithUsedLoginCode);

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(BlockedPageStatus);
            expect(UsersRepository.blockUserLogin).toHaveBeenCalledWith(userWithUsedLoginCode.id, fakeHash(BlockToken), AppConfig.login_block_duration, true);
        });

        it('Does not block with a wrong token', async () => {
            const userWithOtherBlockToken: User = buildUser({ login_block_token_hash: fakeHash("other-token") });
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(userWithOtherBlockToken);

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Does not block a user who has no block link', async () => {
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser());

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Returns the same page for an unknown user as for a wrong token', async () => {
            vi.mocked(UsersRepository._getUserById).mockRejectedValue(new AppError("User not found", 404));

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Returns the invalid link page when the block link was already used', async () => {
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ login_block_token_hash: fakeHash(BlockToken) }));
            vi.mocked(UsersRepository.blockUserLogin).mockResolvedValue(false);

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
        });

        it('Returns the error page when the database fails', async () => {
            vi.mocked(UsersRepository._getUserById).mockRejectedValue(new AppError("Database unknown error"));

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(ErrorPageStatus);
        });
    });


    /*=========*/
    /* Session */
    /*=========*/
    describe('Session of the user of a JWT', () => {
        beforeEach(() => {
            vi.mocked(Jwt.verifyJwt).mockReturnValue(JwtUser);
            vi.mocked(UsersRepository.getUser).mockResolvedValue(buildUser({ secret_hash: "secret-hash" }));
        });


        it('Returns the user of the JWT without his secrets', async () => {
            const selectedUser = await selectUser(CurrentJwt);

            expect(UsersRepository.getUser).toHaveBeenCalledWith(JwtUser);
            expect(selectedUser).toMatchObject({ id: 1, email: "test1@test.fr" });
            expect(selectedUser).not.toHaveProperty("secret_hash");
        });

        it('Renews the JWT of the session with the current information of the user', async () => {
            vi.mocked(Jwt.renewJwt).mockResolvedValue(SignedJwt);

            await expect(regenerateJwt(CurrentJwt)).resolves.toBe(SignedJwt);
            expect(Jwt.renewJwt).toHaveBeenCalledWith(CurrentJwt, expect.not.objectContaining({ secret_hash: expect.anything() }));
        });

        it('Deletes the user of the JWT', async () => {
            await expect(deleteUser(CurrentJwt)).resolves.toBeUndefined();

            expect(UsersRepository.deleteUser).toHaveBeenCalledWith(JwtUser);
        });

        it('Logs out the user of the JWT', async () => {
            await expect(logoutUser(CurrentJwt)).resolves.toBeUndefined();

            expect(UsersRepository.logoutUser).toHaveBeenCalledWith(JwtUser);
        });

        it.each([
            ['updateUser', () => updateUser({ email: "test1@test.fr", pseudo: "New pseudo" }, CurrentJwt), UsersRepository.updateUser],
            ['deleteUser', () => deleteUser(CurrentJwt), UsersRepository.deleteUser],
            ['logoutUser', () => logoutUser(CurrentJwt), UsersRepository.logoutUser],
        ])('%s refuses a closed session, or the session of an address never proven, before changing anything', async (_functionName, callService, repositoryFunction) => {
            const closedSessionError = new AppError("Email address not verified, please log in with a code", 401);
            vi.mocked(UsersRepository.getUser).mockRejectedValueOnce(closedSessionError);

            await expect(callService()).rejects.toBe(closedSessionError);
            expect(UsersRepository.getUser).toHaveBeenCalledWith(JwtUser);
            expect(repositoryFunction).not.toHaveBeenCalled();
        });

        it.each([
            ['selectUser', () => selectUser(CurrentJwt)],
            ['regenerateJwt', () => regenerateJwt(CurrentJwt)],
            ['updateUser', () => updateUser({ email: "test1@test.fr", pseudo: "Pseudo" }, CurrentJwt)],
            ['deleteUser', () => deleteUser(CurrentJwt)],
            ['logoutUser', () => logoutUser(CurrentJwt)],
        ])('%s refuses an invalid JWT', async (_functionName, callService) => {
            const invalidJwtError = new AppError("Invalid JWT", 401);
            vi.mocked(Jwt.verifyJwt).mockImplementationOnce(() => { throw invalidJwtError; });

            await expect(callService()).rejects.toBe(invalidJwtError);
        });
    });


    /*==============*/
    /* Registration */
    /*==============*/
    describe('Registration and update', () => {
        beforeEach(() => {
            vi.mocked(Securities.generateApiToken).mockResolvedValue(EmailVerifyToken);
        });


        it('Gives the failure of the registration to the caller', async () => {
            const insertionError = new AppError("Failed to create user", 500);
            vi.mocked(UsersRepository.insertUser).mockRejectedValueOnce(insertionError);

            await expect(insertUser({ email: "test1@test.fr", pseudo: "Pseudo" }, null, "Floraccess", null)).rejects.toBe(insertionError);
        });

        it('Still changes the email address when the verification email can not be sent, and logs the failure', async () => {
            mockedAppConfig.app_env = "prod";
            const emailFailure = new AppError("Email sending failed", 500);
            vi.mocked(Jwt.verifyJwt).mockReturnValue(JwtUser);
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);
            vi.mocked(UsersRepository.updateUserWithUnverifiedEmail).mockResolvedValue(buildUser({ email: "new-address@test.fr", is_verified_email: false }));
            vi.mocked(sendEmailVerify).mockRejectedValueOnce(emailFailure);

            await expect(updateUser({ email: "new-address@test.fr", pseudo: "Pseudo" }, CurrentJwt)).resolves.toStrictEqual({ isEmailChanged: true });
            await waitForPendingPromises();

            expect(logger.error).toHaveBeenCalledWith(expect.any(String), emailFailure);
        });
    });


    /*=======*/
    /* Login */
    /*=======*/
    describe('Login', () => {
        beforeEach(() => {
            vi.mocked(Securities.generateApiToken).mockResolvedValue(EmailVerifyToken);
            vi.mocked(loginDispatcher).mockResolvedValue(LoginToken);
        });


        it('Registers an unknown email before its first login, with the start of the email as pseudo', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);

            await expect(userLoginRequest({ email: "new-user@test.fr" }, "127.0.0.1")).resolves.toBe(LoginToken);

            expect(UsersRepository.insertUser).toHaveBeenCalledWith({ email: "new-user@test.fr", pseudo: "new-user" }, "127.0.0.1", fakeHash(EmailVerifyToken));
            expect(loginDispatcher).toHaveBeenCalledWith({ email: "new-user@test.fr" });
        });

        it('Completes with "_" an email address whose start is shorter than a pseudo, so that the account can log in', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);

            await userLoginRequest({ email: "jo@test.fr" }, null);

            expect(UsersRepository.insertUser).toHaveBeenCalledWith({ email: "jo@test.fr", pseudo: "jo_" }, null, expect.any(String));
        });

        it('Does not register again the email of an existing user', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(buildUser());

            await expect(userLoginRequest({ email: "test1@test.fr" }, null)).resolves.toBe(LoginToken);

            expect(UsersRepository.insertUser).not.toHaveBeenCalled();
        });

        it('Refuses to create accounts beyond the daily limit, before creating anything, but still logs in the existing users', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);
            vi.mocked(UsersRepository.insertUser).mockResolvedValue(buildUser());
            await userLoginRequest({ email: "first@test.fr" }, null);
            await userLoginRequest({ email: "second@test.fr" }, null);

            await expect(userLoginRequest({ email: "third@test.fr" }, null)).rejects.toMatchObject({ message: NEW_ACCOUNT_LIMIT_REACHED_MESSAGE, httpStatus: 503 });
            expect(UsersRepository.insertUser).toHaveBeenCalledTimes(2);
            expect(loginDispatcher).toHaveBeenCalledTimes(2);

            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(buildUser());
            await expect(userLoginRequest({ email: "test1@test.fr" }, null)).resolves.toBe(LoginToken);
        });

        it('Does not count an account that a simultaneous request already created, and logs in with it', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);
            vi.mocked(UsersRepository.insertUser).mockResolvedValue(null);
            await userLoginRequest({ email: "first@test.fr" }, null);
            await userLoginRequest({ email: "first@test.fr" }, null);

            vi.mocked(UsersRepository.insertUser).mockResolvedValue(buildUser());
            await expect(userLoginRequest({ email: "second@test.fr" }, null)).resolves.toBe(LoginToken);
            expect(loginDispatcher).toHaveBeenCalledTimes(3);
        });

        it('Refuses to create the account when the daily limit of emails is reached', async () => {
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);
            vi.mocked(assertEmailCanBeSent).mockImplementationOnce(() => { throw new AppError("Emails are temporarily unavailable", 503); });

            await expect(userLoginRequest({ email: "new-user@test.fr" }, null)).rejects.toMatchObject({ httpStatus: 503 });
            expect(UsersRepository.insertUser).not.toHaveBeenCalled();
            expect(loginDispatcher).not.toHaveBeenCalled();
        });

        it('Gives the failure of the login request to the caller', async () => {
            const cooldownError = new AppError("A login code was sent recently", 429);
            vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(buildUser());
            vi.mocked(loginDispatcher).mockRejectedValue(cooldownError);

            await expect(userLoginRequest({ email: "test1@test.fr" }, null)).rejects.toBe(cooldownError);
        });

        it('Sends the login confirmation to the authentication method of the user', async () => {
            vi.mocked(loginDispatcher).mockResolvedValue(SignedJwt);

            await expect(userLoginConfirm(LoginConfirm)).resolves.toBe(SignedJwt);
            expect(loginDispatcher).toHaveBeenCalledWith(LoginConfirm);
        });

        it('Gives the failure of the login confirmation to the caller', async () => {
            const invalidCodeError = new AppError("Invalid token", 401);
            vi.mocked(loginDispatcher).mockRejectedValue(invalidCodeError);

            await expect(userLoginConfirm(LoginConfirm)).rejects.toBe(invalidCodeError);
        });
    });


    /*====================*/
    /* Verification email */
    /*====================*/
    describe('Verification email', () => {
        it('Only logs the verification link in the development environment', async () => {
            await sendVerificationEmail(1, "test1@test.fr", EmailVerifyToken);

            expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining(`/users/email/verify/1?token=${EmailVerifyToken}`));
            expect(sendEmailVerify).not.toHaveBeenCalled();
        });

        it('Sends the verification link with the application and the domain encoded in the URL', async () => {
            mockedAppConfig.app_env = "prod";

            await sendVerificationEmail(1, "test1@test.fr", EmailVerifyToken, "Mon appli", "econoris.fr");

            expect(sendEmailVerify).toHaveBeenCalledWith(
                "test1@test.fr",
                `http://localhost/users/email/verify/1?token=${EmailVerifyToken}&application=Mon%20appli&domain=econoris.fr`,
            );
        });

        it('Uses the name of the API and no domain by default', async () => {
            mockedAppConfig.app_env = "prod";

            await sendVerificationEmail(1, "test1@test.fr", EmailVerifyToken);

            expect(sendEmailVerify).toHaveBeenCalledWith("test1@test.fr", expect.stringContaining("&application=Floraccess&domain=null"));
        });

        it('Gives the failure of the sending to the caller', async () => {
            mockedAppConfig.app_env = "prod";
            const emailFailure = new AppError("Email sending failed", 500);
            vi.mocked(sendEmailVerify).mockRejectedValueOnce(emailFailure);

            await expect(sendVerificationEmail(1, "test1@test.fr", EmailVerifyToken)).rejects.toBe(emailFailure);
        });
    });


    /*====================*/
    /* Email verification */
    /*====================*/
    describe('Email verification', () => {
        it('Verifies the email when the token of the link is correct', async () => {
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: false, email_verify_token_hash: fakeHash(EmailVerifyToken) }));

            await expect(UserEmailVerify({ userId: "1", token: EmailVerifyToken })).resolves.toBe("Email 'test1@test.fr' confirmé");
            expect(UsersRepository.UserEmailVerify).toHaveBeenCalledWith(1);
        });

        it('Displays the invalid link page for a user who does not exist', async () => {
            vi.mocked(UsersRepository._getUserById).mockRejectedValue(new AppError("User not found", 404));

            await expect(UserEmailVerify({ userId: "404", token: EmailVerifyToken })).resolves.toBe(InvalidLinkPageStatus);
        });

        it('Displays the invalid link page for a user who has no verification token', async () => {
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: false, email_verify_token_hash: null }));

            await expect(UserEmailVerify({ userId: "1", token: EmailVerifyToken })).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.UserEmailVerify).not.toHaveBeenCalled();
        });

        it('Displays the invalid link page for an address already verified, even with its former token', async () => {
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: true, email_verify_token_hash: fakeHash(EmailVerifyToken) }));

            await expect(UserEmailVerify({ userId: "1", token: EmailVerifyToken })).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.UserEmailVerify).not.toHaveBeenCalled();
        });

        it('Displays an unknown error page, and logs the error, when an unexpected error happens', async () => {
            const unexpectedError = new Error("Unexpected failure");
            vi.mocked(UsersRepository._getUserById).mockRejectedValue(unexpectedError);

            await expect(UserEmailVerify({ userId: "1", token: EmailVerifyToken })).resolves.toBe("Erreur Inconnue");
            expect(logger.error).toHaveBeenCalledWith(expect.any(String), unexpectedError);
        });
    });


    /*==========================*/
    /* Unverified users removal */
    /*==========================*/
    describe('Deletion of the unverified users', () => {
        it('Deletes the users whose email address was not proven within 3 months', async () => {
            vi.mocked(UsersRepository.deleteUnverifiedUsersCreatedBefore).mockResolvedValue(2);

            await expect(deleteExpiredUnverifiedUsers()).resolves.toBe(2);

            expect(UNVERIFIED_USER_RETENTION_IN_MONTHS).toBe(3);
            expect(UsersRepository.deleteUnverifiedUsersCreatedBefore).toHaveBeenCalledWith(3);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneMinute: number = 60 * 1000;
const OneDay: number = 24 * 60 * OneMinute;
const BlockToken: string = "abcdef0123456789";

const BlockedPageStatus: string = "Connexions bloquées";
const InvalidLinkPageStatus: string = "Lien invalide";
const ErrorPageStatus: string = "Erreur";

/**
 * Hash used in place of Argon2 to keep the tests fast and predictable.
 * @param input String to hash
 * @returns Fake hash of the input
 */
function fakeHash(input: string): string {
    return `hash:${input}`;
}

const LoginBlockLink: UserLoginBlock = {
    userId: "1",
    token: BlockToken,
};

const CurrentJwt: string = "current-jwt";
const SignedJwt: string = "signed-jwt";
const LoginToken: string = "login-token";
const EmailVerifyToken: string = "0123456789abcdef";

const JwtUser: UserSafe = {
    id: 1,
    email: "test1@test.fr",
    pseudo: "Pseudo",

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_logout_at: new Date(),

    created_at: new Date(),
};

const LoginConfirm: UserLoginConfirm = {
    email: "test1@test.fr",
    token: LoginToken,
    secret: "123456",
    ip: null,
};

/**
 * Lets the promises which are not awaited by the service finish, such as the sending of the email.
 */
function waitForPendingPromises(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}
