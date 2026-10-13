import type { User, UserLoginConfirm } from "../../../../../src/modules/users/users.types";

import AppConfig from "../../../../../src/config/AppConfig";
import { usersLoginConfirm, usersLoginRequest } from "../../../../../src/modules/users/auth-methods/code/code.service";
import * as CodeRepository from "../../../../../src/modules/users/auth-methods/code/code.repository";
import * as Securities from "../../../../../src/core/utils/securities";
import { generateJwt } from "../../../../../src/core/utils/jwt";
import { buildUser } from "../../users.fixtures";



/* The database, the hashing, the emails and the JWT are replaced, only the rules of the login code are tested */
jest.mock("../../../../../src/modules/users/auth-methods/code/code.repository", () => ({
    userLoginRequest: jest.fn(),
    consumeLoginCodeAttempt: jest.fn(),
    userLoginConfirm: jest.fn(),
}));

jest.mock("../../../../../src/modules/users/auth-methods/code/code.email", () => ({
    sendEmailCode: jest.fn(),
}));

jest.mock("../../../../../src/core/utils/securities", () => ({
    generateApiToken: jest.fn(),
    generateSecureRandomDelay: jest.fn(),
    hashString: jest.fn(),
    verifyHash: jest.fn(),
}));

jest.mock("../../../../../src/core/utils/jwt", () => ({
    generateJwt: jest.fn(),
}));

jest.mock("../../../../../src/core/utils/logger", () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
        warning: jest.fn(),
        success: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    },
}));



/**
 * Auth methods code module tests
 */
describe('Auth methods code module', () => {
    /**
     * Auth methods code schema tests
     */
    describe('Auth methods code schema', () => {
        it('Correct Auth Methods code', () => {

        });

        it('Incorrect Auth Methods code', () => {

        });
    });


    /**
     * Auth methods code service tests
     */
    describe('Auth methods code service', () => {
        beforeEach(() => {
            /* The login token is generated first, the token of the block link second */
            jest.mocked(Securities.generateApiToken).mockReset().mockResolvedValueOnce(ValidToken).mockResolvedValueOnce(BlockToken);
            jest.mocked(Securities.hashString).mockImplementation(async (input: string) => fakeHash(input));
            jest.mocked(Securities.verifyHash).mockImplementation(async (input: string, hash: string) => hash === fakeHash(input));
            jest.mocked(CodeRepository.userLoginRequest).mockResolvedValue(true);
            jest.mocked(CodeRepository.consumeLoginCodeAttempt).mockResolvedValue(true);
            jest.mocked(CodeRepository.userLoginConfirm).mockResolvedValue(UserWithPendingLoginCode);
            jest.mocked(generateJwt).mockResolvedValue(SignedJwt);
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
                jest.mocked(CodeRepository.userLoginRequest).mockResolvedValue(false);

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

                await expect(usersLoginConfirm(userWithExpiredLoginCode, CorrectLoginConfirm)).rejects.toMatchObject({ httpStatus: 401 });
                expect(CodeRepository.userLoginConfirm).not.toHaveBeenCalled();
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

            it('Rejects the correct code when all the attempts are used', async () => {
                jest.mocked(CodeRepository.consumeLoginCodeAttempt).mockResolvedValue(false);

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
