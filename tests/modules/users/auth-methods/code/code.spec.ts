import type { User, UserLoginConfirm } from "../../../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRandomValues } from "node:crypto";
import AppConfig from "../../../../../src/config/AppConfig";
import { getLoginRequestCooldown, INVALID_LOGIN_TOKEN_MESSAGE, usersLoginConfirm, usersLoginRequest } from "../../../../../src/modules/users/auth-methods/code/code.service";
import * as CodeRepository from "../../../../../src/modules/users/auth-methods/code/code.repository";
import * as Securities from "../../../../../src/core/utils/securities";
import { sendEmailCode } from "../../../../../src/modules/users/auth-methods/code/code.email";
import { generateJwt } from "../../../../../src/core/utils/jwt";
import { assertEmailCanBeSent } from "../../../../../src/core/email/mailer";
import { AppError } from "../../../../../src/core/models/AppError.model";
import logger from "../../../../../src/core/utils/logger";
import { buildUser } from "../../users.fixtures";



/* The login codes are only sent by email outside of the development environment : each test chooses its own */
const { mockedAppConfig } = vi.hoisted(() => ({
    mockedAppConfig: {
        app_env: "dev",
        app_name: "Floraccess",
        base_url: "http://localhost",
        code_data_set: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        login_request_cooldown: 60 * 1000,
        login_request_extended_cooldown: 10 * 60 * 1000,
        login_block_duration: 24 * 60 * 60 * 1000,
        login_code_max_attempts: 5,
        token_expiration: 30 * 60 * 1000,
    },
}));

vi.mock("../../../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));

/* The real random values are kept, the tests can replace them to choose their result or make them fail */
vi.mock("node:crypto", async (importOriginal) => {
    const actualCrypto = await importOriginal<typeof import("node:crypto")>();

    return {
        ...actualCrypto,
        getRandomValues: vi.fn(actualCrypto.getRandomValues),
    };
});

/* The database, the hashing, the emails and the JWT are replaced, only the rules of the login code are tested */
vi.mock("../../../../../src/modules/users/auth-methods/code/code.repository", () => ({
    userLoginRequest: vi.fn(),
    blockLoginsAfterTooManyCodes: vi.fn(),
    consumeLoginCodeAttempt: vi.fn(),
    userLoginConfirm: vi.fn(),
}));

vi.mock("../../../../../src/modules/users/auth-methods/code/code.email", () => ({
    sendEmailCode: vi.fn(),
}));

vi.mock("../../../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    generateSecureRandomDelay: vi.fn(),
    hashString: vi.fn(),
    verifyHash: vi.fn(),
    hashToken: vi.fn(),
    verifyToken: vi.fn(),
}));

/* The daily limit of emails is tested with the mailer, each test here chooses if it is reached */
vi.mock("../../../../../src/core/email/mailer", () => ({
    assertEmailCanBeSent: vi.fn(),
}));

vi.mock("../../../../../src/core/utils/jwt", () => ({
    generateJwt: vi.fn(),
}));

vi.mock("../../../../../src/core/utils/logger", () => ({
    default: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));



/**
 * Auth methods code module tests
 */
describe('Auth methods code module', () => {
    /**
     * Auth methods code service tests
     */
    describe('Auth methods code service', () => {
        beforeEach(() => {
            mockedAppConfig.app_env = "dev";

            /* The login token is generated first, the token of the block link second */
            vi.mocked(Securities.generateApiToken).mockReset().mockResolvedValueOnce(ValidToken).mockResolvedValueOnce(BlockToken);
            vi.mocked(Securities.hashString).mockImplementation(async (input: string) => fakeHash(input));
            vi.mocked(Securities.verifyHash).mockImplementation(async (input: string, hash: string) => hash === fakeHash(input));
            vi.mocked(Securities.hashToken).mockImplementation((input: string) => fakeHash(input));
            vi.mocked(Securities.verifyToken).mockImplementation(async (input: string, hash: string) => hash === fakeHash(input));
            vi.mocked(CodeRepository.userLoginRequest).mockResolvedValue(true);
            vi.mocked(CodeRepository.blockLoginsAfterTooManyCodes).mockResolvedValue();
            vi.mocked(CodeRepository.consumeLoginCodeAttempt).mockResolvedValue(true);
            vi.mocked(CodeRepository.userLoginConfirm).mockResolvedValue(UserWithPendingLoginCode);
            vi.mocked(generateJwt).mockResolvedValue(SignedJwt);
        });


        /*===============*/
        /* Login request */
        /*===============*/
        describe('Login request', () => {
            it('Returns the token of a new login code', async () => {
                const userWithoutPendingLoginCode: User = buildUser();

                await expect(usersLoginRequest(userWithoutPendingLoginCode)).resolves.toBe(ValidToken);
                expect(CodeRepository.userLoginRequest).toHaveBeenCalledTimes(1);
            });

            it('Stores the hash of the block token with the hashes of the login code', async () => {
                const userWithoutPendingLoginCode: User = buildUser();

                await usersLoginRequest(userWithoutPendingLoginCode);

                expect(CodeRepository.userLoginRequest).toHaveBeenCalledWith(
                    userWithoutPendingLoginCode,
                    fakeHash(ValidToken),
                    expect.any(String),
                    fakeHash(BlockToken),
                    AppConfig.login_request_cooldown,
                );
            });

            it('Accepts a new login code right after the previous one was used', async () => {
                const userJustLoggedIn: User = buildUser({ login_requested_at: new Date(), last_login: new Date() });

                await expect(usersLoginRequest(userJustLoggedIn)).resolves.toBe(ValidToken);
            });

            it('Rejects a new login code during the cooldown', async () => {
                await expect(usersLoginRequest(UserWithPendingLoginCode)).rejects.toMatchObject({ httpStatus: 429 });
                expect(CodeRepository.userLoginRequest).not.toHaveBeenCalled();
            });

            it('Rejects a new login code when a simultaneous request already stored one', async () => {
                const userWithoutPendingLoginCode: User = buildUser();
                vi.mocked(CodeRepository.userLoginRequest).mockResolvedValue(false);

                await expect(usersLoginRequest(userWithoutPendingLoginCode)).rejects.toMatchObject({ httpStatus: 429 });
            });

            it('Accepts a new login code after the cooldown', async () => {
                const userAfterCooldown: User = {
                    ...UserWithPendingLoginCode,
                    login_requested_at: new Date(Date.now() - AppConfig.login_request_cooldown - OneSecond),
                };

                await expect(usersLoginRequest(userAfterCooldown)).resolves.toBe(ValidToken);
                expect(CodeRepository.userLoginRequest).toHaveBeenCalledTimes(1);
            });

            it('Sends the code and the block link by email outside of the development environment', async () => {
                mockedAppConfig.app_env = "prod";
                const user: User = buildUser();

                await usersLoginRequest(user);

                expect(sendEmailCode).toHaveBeenCalledWith(user.email, "Floraccess", expect.stringMatching(/^[A-Z0-9]{6}$/), `http://localhost/users/login/block/${user.id}?token=${BlockToken}`);
            });

            it('Does not send the code by email in the development environment', async () => {
                await usersLoginRequest(buildUser());

                expect(sendEmailCode).not.toHaveBeenCalled();
            });

            it('Draws again the random values which would make some characters of the code more frequent', async () => {
                mockedAppConfig.app_env = "prod";
                vi.mocked(getRandomValues).mockImplementationOnce((array) => (array as Uint32Array).fill(0xFFFFFFFF));

                await usersLoginRequest(buildUser());

                expect(getRandomValues).toHaveBeenCalledTimes(2);
                expect(sendEmailCode).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.stringMatching(/^[A-Z0-9]{6}$/), expect.any(String));
            });

            it('Fails when no random value can be drawn for the code', async () => {
                const entropyError = new Error("No entropy");
                vi.mocked(getRandomValues).mockImplementationOnce(() => { throw entropyError; });

                await expect(usersLoginRequest(buildUser())).rejects.toBe(entropyError);
                expect(CodeRepository.userLoginRequest).not.toHaveBeenCalled();
            });

            it('Hashes the short code with Argon2, and the long random tokens with the fast keyed hash', async () => {
                await usersLoginRequest(buildUser());

                expect(Securities.hashString).toHaveBeenCalledTimes(1);
                expect(Securities.hashString).toHaveBeenCalledWith(expect.stringMatching(/^[A-Z0-9]{6}$/));
                expect(Securities.hashToken).toHaveBeenCalledWith(ValidToken);
                expect(Securities.hashToken).toHaveBeenCalledWith(BlockToken);
            });

            it('Refuses a new code without storing it when the daily limit of emails is reached', async () => {
                vi.mocked(assertEmailCanBeSent).mockImplementationOnce(() => { throw new AppError("Emails are temporarily unavailable", 503); });

                await expect(usersLoginRequest(buildUser())).rejects.toMatchObject({ httpStatus: 503 });
                expect(Securities.generateApiToken).not.toHaveBeenCalled();
                expect(CodeRepository.userLoginRequest).not.toHaveBeenCalled();
            });
        });


        /*==========================*/
        /* Codes sent without login */
        /*==========================*/
        describe('Login codes sent without a successful login', () => {
            it('Keeps the base cooldown for the first 5 codes sent without a successful login', () => {
                for (let codesSentWithoutLogin = 0; codesSentWithoutLogin < 5; codesSentWithoutLogin++) {
                    expect(getLoginRequestCooldown(codesSentWithoutLogin)).toBe(AppConfig.login_request_cooldown);
                }
            });

            it('Waits the extended cooldown between two codes once 5 codes were sent without a successful login', () => {
                for (let codesSentWithoutLogin = 5; codesSentWithoutLogin <= 10; codesSentWithoutLogin++) {
                    expect(getLoginRequestCooldown(codesSentWithoutLogin)).toBe(AppConfig.login_request_extended_cooldown);
                }
            });

            it('Rejects a new code during the extended cooldown, even after the base cooldown', async () => {
                const userAfterFiveCodes: User = buildUserAfterCodesWithoutLogin(5, 3 * OneMinute);

                await expect(usersLoginRequest(userAfterFiveCodes)).rejects.toMatchObject({ httpStatus: 429 });
                expect(CodeRepository.userLoginRequest).not.toHaveBeenCalled();
            });

            it('Accepts a new code after the extended cooldown, and gives this cooldown to the query which stores the code', async () => {
                const userAfterFiveCodes: User = buildUserAfterCodesWithoutLogin(5, AfterExtendedCooldown);

                await expect(usersLoginRequest(userAfterFiveCodes)).resolves.toBe(ValidToken);
                expect(CodeRepository.userLoginRequest).toHaveBeenCalledWith(userAfterFiveCodes, expect.any(String), expect.any(String), expect.any(String), AppConfig.login_request_extended_cooldown);
            });

            it('Still sends the 10th code: only the request which follows it blocks the logins', async () => {
                const userAfterNineCodes: User = buildUserAfterCodesWithoutLogin(9, AfterExtendedCooldown);

                await expect(usersLoginRequest(userAfterNineCodes)).resolves.toBe(ValidToken);
                expect(CodeRepository.blockLoginsAfterTooManyCodes).not.toHaveBeenCalled();
            });

            it('Keeps the 10th code usable until the extended cooldown is over', async () => {
                const userAfterTenCodes: User = buildUserAfterCodesWithoutLogin(10, 3 * OneMinute);

                await expect(usersLoginRequest(userAfterTenCodes)).rejects.toMatchObject({ httpStatus: 429 });
                expect(CodeRepository.blockLoginsAfterTooManyCodes).not.toHaveBeenCalled();
            });

            it('Blocks the logins for the duration of the block link instead of sending an 11th code', async () => {
                mockedAppConfig.app_env = "prod";
                const userAfterTenCodes: User = buildUserAfterCodesWithoutLogin(10, AfterExtendedCooldown);

                await expect(usersLoginRequest(userAfterTenCodes)).rejects.toMatchObject({ httpStatus: 403 });
                expect(CodeRepository.blockLoginsAfterTooManyCodes).toHaveBeenCalledWith(userAfterTenCodes, AppConfig.login_block_duration);
                expect(CodeRepository.userLoginRequest).not.toHaveBeenCalled();
                expect(sendEmailCode).not.toHaveBeenCalled();
            });

            it('Writes the block in the logs with the identifier of the user, never with his email address', async () => {
                const userAfterTenCodes: User = buildUserAfterCodesWithoutLogin(10, AfterExtendedCooldown);

                await expect(usersLoginRequest(userAfterTenCodes)).rejects.toMatchObject({ httpStatus: 403 });
                expect(logger.warning).toHaveBeenCalledWith(expect.stringContaining(`user-${userAfterTenCodes.id}`));
                expect(logger.warning).not.toHaveBeenCalledWith(expect.stringContaining(userAfterTenCodes.email));
            });

            it('Does not make a user wait after a successful login, whatever the number of codes he received before', async () => {
                const userJustLoggedIn: User = buildUser({ login_requests_without_login: 0, login_requested_at: new Date(), last_login: new Date() });

                await expect(usersLoginRequest(userJustLoggedIn)).resolves.toBe(ValidToken);
            });
        });


        /*===============*/
        /* Login confirm */
        /*===============*/
        describe('Login confirm', () => {
            it('Returns a JWT when the token and the code are correct', async () => {
                await expect(usersLoginConfirm(UserWithPendingLoginCode, CorrectLoginConfirm)).resolves.toBe(SignedJwt);
                expect(CodeRepository.userLoginConfirm).toHaveBeenCalledTimes(1);
            });

            it('Rejects when no login code is pending', async () => {
                const userWithoutPendingLoginCode: User = {
                    ...UserWithPendingLoginCode,
                    secret_hash: null,
                    token_hash: null,
                    login_requested_at: null,
                };

                await expect(usersLoginConfirm(userWithoutPendingLoginCode, CorrectLoginConfirm)).rejects.toMatchObject({ httpStatus: 401 });
                expect(CodeRepository.userLoginConfirm).not.toHaveBeenCalled();
            });

            it('Rejects an expired login code, even with the correct token and code', async () => {
                const userWithExpiredLoginCode: User = {
                    ...UserWithPendingLoginCode,
                    login_requested_at: new Date(Date.now() - AppConfig.token_expiration - OneSecond),
                };

                await expect(usersLoginConfirm(userWithExpiredLoginCode, CorrectLoginConfirm)).rejects.toMatchObject({ message: "Token has expired", httpStatus: 401 });
                expect(CodeRepository.userLoginConfirm).not.toHaveBeenCalled();
            });

            it('Tells that a code expired only to the device which requested it, any other confirmation gets the refusal of a wrong token', async () => {
                const userWithExpiredLoginCode: User = {
                    ...UserWithPendingLoginCode,
                    login_requested_at: new Date(Date.now() - AppConfig.token_expiration - OneSecond),
                };
                const loginConfirmWithWrongToken: UserLoginConfirm = { ...CorrectLoginConfirm, token: "wrong-token" };

                await expect(usersLoginConfirm(userWithExpiredLoginCode, loginConfirmWithWrongToken)).rejects.toMatchObject({ message: INVALID_LOGIN_TOKEN_MESSAGE, httpStatus: 401 });
            });

            it('Rejects a wrong token without counting an attempt', async () => {
                const loginConfirmWithWrongToken: UserLoginConfirm = { ...CorrectLoginConfirm, token: "wrong-token" };

                await expect(usersLoginConfirm(UserWithPendingLoginCode, loginConfirmWithWrongToken)).rejects.toMatchObject({ httpStatus: 401 });
                expect(CodeRepository.consumeLoginCodeAttempt).not.toHaveBeenCalled();
                expect(CodeRepository.userLoginConfirm).not.toHaveBeenCalled();
            });

            it('Rejects a wrong code and counts an attempt', async () => {
                const loginConfirmWithWrongCode: UserLoginConfirm = { ...CorrectLoginConfirm, secret: "000000" };

                await expect(usersLoginConfirm(UserWithPendingLoginCode, loginConfirmWithWrongCode)).rejects.toMatchObject({ httpStatus: 401 });
                expect(CodeRepository.consumeLoginCodeAttempt).toHaveBeenCalledWith(UserWithPendingLoginCode.id, UserWithPendingLoginCode.token_hash, AppConfig.login_code_max_attempts);
                expect(CodeRepository.userLoginConfirm).not.toHaveBeenCalled();
            });

            it('Checks the login token with the fast keyed hash and the code with Argon2', async () => {
                await usersLoginConfirm(UserWithPendingLoginCode, CorrectLoginConfirm);

                expect(Securities.verifyToken).toHaveBeenCalledWith(ValidToken, UserWithPendingLoginCode.token_hash);
                expect(Securities.verifyHash).toHaveBeenCalledWith(ValidCode, UserWithPendingLoginCode.secret_hash);
            });

            it('Rejects the correct code when all the attempts are used', async () => {
                vi.mocked(CodeRepository.consumeLoginCodeAttempt).mockResolvedValue(false);

                await expect(usersLoginConfirm(UserWithPendingLoginCode, CorrectLoginConfirm)).rejects.toMatchObject({ httpStatus: 429 });
                expect(CodeRepository.userLoginConfirm).not.toHaveBeenCalled();
            });
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneSecond: number = 1000;
const OneMinute: number = 60 * OneSecond;
const ValidToken: string = "valid-token";
const BlockToken: string = "block-token";
const ValidCode: string = "123456";
const SignedJwt: string = "signed-jwt";

/**
 * Hash used in place of Argon2 to keep the tests fast and predictable.
 * @param input String to hash
 * @returns Fake hash of the input
 */
function fakeHash(input: string): string {
    return `hash:${input}`;
}

const UserWithPendingLoginCode: User = buildUser({
    secret_hash: fakeHash(ValidCode),
    token_hash: fakeHash(ValidToken),
    login_block_token_hash: fakeHash(BlockToken),
    login_requested_at: new Date(),
});

const CorrectLoginConfirm: UserLoginConfirm = {
    email: UserWithPendingLoginCode.email,
    token: ValidToken,
    secret: ValidCode,
    ip: null,
};

/* Time since the last code which is just beyond the extended cooldown */
const AfterExtendedCooldown: number = AppConfig.login_request_extended_cooldown + OneSecond;

/**
 * Builds a user who already received some login codes without a successful login, the last one still pending.
 * @param codesSentWithoutLogin Number of codes sent since the last successful login.
 * @param timeSinceLastCode Time since the last code was sent, in milliseconds.
 * @returns The user who requests a new code.
 */
function buildUserAfterCodesWithoutLogin(codesSentWithoutLogin: number, timeSinceLastCode: number): User {
    return {
        ...UserWithPendingLoginCode,
        login_requests_without_login: codesSentWithoutLogin,
        login_requested_at: new Date(Date.now() - timeSinceLastCode),
    };
}
