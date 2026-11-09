import type { User, UserLoginConfirm } from "../../../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { usersLoginConfirm } from "../../../../../src/modules/users/auth-methods/code/code.service";
import * as CodeRepository from "../../../../../src/modules/users/auth-methods/code/code.repository";
import * as UsersRepository from "../../../../../src/modules/users/users.repository";
import * as Securities from "../../../../../src/core/utils/securities";
import { generateJwt } from "../../../../../src/core/utils/jwt";



/* The database, the hashing, the emails and the JWT are replaced, only the rules of the service are tested. */
/* consumeLoginCodeAttempt only exists on the branch fix/login-code-bruteforce : this test then stays valid whatever the order of the merges */
vi.mock("../../../../../src/modules/users/auth-methods/code/code.repository", () => ({
    userLoginRequest: vi.fn(),
    userLoginConfirm: vi.fn(),
    consumeLoginCodeAttempt: vi.fn(async () => true),
}));

vi.mock("../../../../../src/modules/users/users.repository", () => ({
    invalidateUserSessions: vi.fn(),
}));

vi.mock("../../../../../src/modules/users/auth-methods/code/code.email", () => ({
    sendEmailCode: vi.fn(),
}));

vi.mock("../../../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    generateSecureRandomDelay: vi.fn(),
    hashString: vi.fn(),
    verifyHash: vi.fn(),
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
 * Sessions opened before the email address of an account was proven
 */
describe('Sessions opened before the proof of the email address', () => {
    beforeEach(() => {
        vi.mocked(Securities.verifyHash).mockImplementation(async (input: string, hash: string) => hash === fakeHash(input));
        vi.mocked(generateJwt).mockImplementation(async (payload) => `jwt-of-logout-${payload.last_logout_at.getTime()}`);
    });


    it('Invalidates the earlier JWT when the login code proves the email address for the first time', async () => {
        const unverifiedUser: User = buildUserWithLoginCode({ is_verified_email: false });
        const loggedInUser: User = { ...unverifiedUser, is_verified_email: true };
        const userWithNewSessions: User = { ...loggedInUser, last_logout_at: new Date() };
        vi.mocked(CodeRepository.userLoginConfirm).mockResolvedValue(loggedInUser);
        vi.mocked(UsersRepository.invalidateUserSessions).mockResolvedValue(userWithNewSessions);

        const jwt = await usersLoginConfirm(unverifiedUser, LoginConfirm);

        expect(UsersRepository.invalidateUserSessions).toHaveBeenCalledWith(unverifiedUser.id);
        expect(jwt).toBe(`jwt-of-logout-${userWithNewSessions.last_logout_at.getTime()}`);
    });

    it('Keeps the other sessions of a user whose email address was already proven', async () => {
        const verifiedUser: User = buildUserWithLoginCode({ is_verified_email: true });
        vi.mocked(CodeRepository.userLoginConfirm).mockResolvedValue(verifiedUser);

        const jwt = await usersLoginConfirm(verifiedUser, LoginConfirm);

        expect(UsersRepository.invalidateUserSessions).not.toHaveBeenCalled();
        expect(jwt).toBe(`jwt-of-logout-${verifiedUser.last_logout_at.getTime()}`);
    });
});


/*===========*/
/* Test data */
/*===========*/
const LoginToken: string = "login-token";
const LoginCode: string = "123456";

const LoginConfirm: UserLoginConfirm = {
    email: "test1@test.fr",
    token: LoginToken,
    secret: LoginCode,
    ip: null,
};

/**
 * Hash used in place of Argon2 to keep the tests fast and predictable.
 * @param input String to hash
 * @returns Fake hash of the input
 */
function fakeHash(input: string): string {
    return `hash:${input}`;
}

/**
 * Builds a user who received a login code and can confirm his login.
 *
 * The user also carries the date of the login request, which the hardened login code of the branch
 * fix/login-code-bruteforce requires : this test then stays valid whatever the order of the merges.
 * @param overrides Fields which replace the default ones
 * @returns User object
 */
function buildUserWithLoginCode(overrides: Partial<User>): User {
    const oneHourAgo: Date = new Date(Date.now() - 60 * 60 * 1000);

    return {
        id: 1,
        email: LoginConfirm.email,
        pseudo: "Pseudo",

        auth_methods_id: 1,
        is_connected: false,
        is_verified_email: false,
        last_logout_at: oneHourAgo,
        last_login: oneHourAgo,
        last_ip: null,

        email_verify_token_hash: null,
        secret_hash: fakeHash(LoginCode),
        token_hash: fakeHash(LoginToken),
        login_requested_at: new Date(),

        is_admin: false,
        created_at: oneHourAgo,

        ...overrides,
    } as User;
}
