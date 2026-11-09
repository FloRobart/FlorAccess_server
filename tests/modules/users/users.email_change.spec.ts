import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UpdateUser, User, UserSafe } from "../../../src/modules/users/users.types";

import { updateUser } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import * as Jwt from "../../../src/core/utils/jwt";
import { sendEmailVerify } from "../../../src/modules/users/users.email";



/* The emails are only sent outside of the development environment */
vi.mock("../../../src/config/AppConfig", () => ({
    default: {
        app_env: "prod",
        app_name: "Floraccess",
        base_url: "http://localhost",
    },
}));

/* The database, the hashing, the emails and the JWT are replaced, only the rules of the service are tested */
vi.mock("../../../src/modules/users/users.repository", () => ({
    updateUser: vi.fn(),
    updateUserWithUnverifiedEmail: vi.fn(),
}));

vi.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    hashString: vi.fn(),
    verifyHash: vi.fn(),
}));

/* renewJwt is the function which generates the JWT on the branch fix/logout-revocation : this test then stays valid whatever the order of the merges */
vi.mock("../../../src/core/utils/jwt", () => ({
    generateJwt: vi.fn(),
    renewJwt: vi.fn(),
    verifyJwt: vi.fn(),
}));

vi.mock("../../../src/modules/users/users.email", () => ({
    sendEmailVerify: vi.fn(),
}));

vi.mock("../../../src/core/dispatcher/login.dispatcher", () => ({
    loginDispatcher: vi.fn(),
}));

vi.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: vi.fn(),
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
 * Change of the email address of a user
 */
describe('Change of the email address of a user', () => {
    beforeEach(() => {
        const jwtFunctions = Jwt as unknown as Record<string, Mock>;
        jwtFunctions.verifyJwt.mockReturnValue(CurrentUser);
        jwtFunctions.generateJwt.mockResolvedValue(SignedJwt);
        jwtFunctions.renewJwt.mockResolvedValue(SignedJwt);

        vi.mocked(Securities.generateApiToken).mockResolvedValue(EmailVerifyToken);
        vi.mocked(Securities.hashString).mockImplementation(async (input: string) => `hash:${input}`);
        vi.mocked(sendEmailVerify).mockResolvedValue();
    });


    it('Keeps the email address verified when only the pseudo changes', async () => {
        const pseudoChange: UpdateUser = { email: CurrentUser.email, pseudo: "New pseudo" };
        vi.mocked(UsersRepository.updateUser).mockResolvedValue(buildUser({ pseudo: pseudoChange.pseudo }));

        await expect(updateUser(pseudoChange, "current-jwt")).resolves.toBe(SignedJwt);

        expect(UsersRepository.updateUser).toHaveBeenCalledWith(pseudoChange, CurrentUser);
        expect(UsersRepository.updateUserWithUnverifiedEmail).not.toHaveBeenCalled();
        expect(sendEmailVerify).not.toHaveBeenCalled();
    });

    it('Marks a new email address as not verified and sends it a verification email', async () => {
        const emailChange: UpdateUser = { email: "new-address@test.fr", pseudo: CurrentUser.pseudo };
        const userWithUnverifiedEmail: User = buildUser({ email: emailChange.email, is_verified_email: false });
        vi.mocked(UsersRepository.updateUserWithUnverifiedEmail).mockResolvedValue(userWithUnverifiedEmail);

        await expect(updateUser(emailChange, "current-jwt")).resolves.toBe(SignedJwt);
        await waitForPendingPromises();

        expect(UsersRepository.updateUser).not.toHaveBeenCalled();
        expect(UsersRepository.updateUserWithUnverifiedEmail).toHaveBeenCalledWith(emailChange, CurrentUser, `hash:${EmailVerifyToken}`);
        expect(sendEmailVerify).toHaveBeenCalledWith(emailChange.email, expect.any(String), expect.stringContaining(EmailVerifyToken));
    });
});


/*===========*/
/* Test data */
/*===========*/
const SignedJwt: string = "signed-jwt";
const EmailVerifyToken: string = "abcdef0123456789";
const OneHourAgo: Date = new Date(Date.now() - 60 * 60 * 1000);

const CurrentUser: UserSafe = {
    id: 1,
    email: "current-address@test.fr",
    pseudo: "Pseudo",

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_logout_at: OneHourAgo,

    created_at: OneHourAgo,
};

/**
 * Builds the complete user returned by the database after an update.
 *
 * The type assertion keeps this fixture valid when other fields are added to the users.
 * @param overrides Fields which replace the ones of the current user
 * @returns User object
 */
function buildUser(overrides: Partial<User>): User {
    return {
        ...CurrentUser,
        last_login: OneHourAgo,
        last_ip: null,

        email_verify_token_hash: null,
        secret_hash: null,
        token_hash: null,

        is_admin: false,

        ...overrides,
    } as User;
}

/**
 * Lets the promises which are not awaited by the service finish, such as the sending of the email.
 */
function waitForPendingPromises(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}
