import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UpdateUser, User, UserSafe } from "../../../src/modules/users/users.types";

import { updateUser } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import * as Jwt from "../../../src/core/utils/jwt";
import { sendEmailVerify } from "../../../src/modules/users/users.email";
import { assertEmailCanBeSent } from "../../../src/core/email/mailer";
import { AppError } from "../../../src/core/models/AppError.model";



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
    getUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserWithUnverifiedEmail: vi.fn(),
    _getUserByEmail: vi.fn(),
    logoutUser: vi.fn(),
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
        vi.mocked(Securities.hashToken).mockImplementation((input: string) => `hash:${input}`);
        vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(null);
        vi.mocked(sendEmailVerify).mockResolvedValue();
    });


    it('Keeps the email address verified when only the pseudo changes', async () => {
        const pseudoChange: UpdateUser = { email: CurrentUser.email, pseudo: "New pseudo" };
        vi.mocked(UsersRepository.updateUser).mockResolvedValue(buildUser({ pseudo: pseudoChange.pseudo }));

        await expect(updateUser(pseudoChange, "current-jwt")).resolves.toStrictEqual({ isEmailChanged: false, jwt: SignedJwt });

        expect(UsersRepository.updateUser).toHaveBeenCalledWith(pseudoChange, CurrentUser);
        expect(UsersRepository.updateUserWithUnverifiedEmail).not.toHaveBeenCalled();
        expect(sendEmailVerify).not.toHaveBeenCalled();
    });

    it('Marks a new email address as not verified and sends it a verification email, without giving a JWT for it', async () => {
        const emailChange: UpdateUser = { email: "new-address@test.fr", pseudo: CurrentUser.pseudo };
        const userWithUnverifiedEmail: User = buildUser({ email: emailChange.email, is_verified_email: false, is_connected: false });
        vi.mocked(UsersRepository.updateUserWithUnverifiedEmail).mockResolvedValue(userWithUnverifiedEmail);

        await expect(updateUser(emailChange, "current-jwt")).resolves.toStrictEqual({ isEmailChanged: true });
        await waitForPendingPromises();

        expect(UsersRepository.updateUser).not.toHaveBeenCalled();
        expect(UsersRepository.updateUserWithUnverifiedEmail).toHaveBeenCalledWith(emailChange, CurrentUser, `hash:${EmailVerifyToken}`);
        expect(sendEmailVerify).toHaveBeenCalledWith(emailChange.email, expect.stringContaining(EmailVerifyToken));
        expect(Jwt.renewJwt).not.toHaveBeenCalled();
        expect(Jwt.generateJwt).not.toHaveBeenCalled();
    });

    it('Closes the sessions without any change when the new address belongs to another account, so that the answer reveals no account', async () => {
        const emailChange: UpdateUser = { email: "address-of-another-account@test.fr", pseudo: CurrentUser.pseudo };
        vi.mocked(UsersRepository._getUserByEmail).mockResolvedValue(buildUser({ id: 2, email: emailChange.email }));

        await expect(updateUser(emailChange, "current-jwt")).resolves.toStrictEqual({ isEmailChanged: true });
        await waitForPendingPromises();

        expect(UsersRepository.logoutUser).toHaveBeenCalledWith(CurrentUser);
        expect(UsersRepository.updateUserWithUnverifiedEmail).not.toHaveBeenCalled();
        expect(sendEmailVerify).not.toHaveBeenCalled();
    });

    it('Changes nothing when the daily limit of emails is reached', async () => {
        const emailChange: UpdateUser = { email: "new-address@test.fr", pseudo: CurrentUser.pseudo };
        vi.mocked(assertEmailCanBeSent).mockImplementationOnce(() => { throw new AppError("Emails are temporarily unavailable", 503); });

        await expect(updateUser(emailChange, "current-jwt")).rejects.toMatchObject({ httpStatus: 503 });

        expect(UsersRepository.updateUserWithUnverifiedEmail).not.toHaveBeenCalled();
        expect(UsersRepository.logoutUser).not.toHaveBeenCalled();
    });

    it('Refuses a closed session before looking at the new address, so that it can not tell which addresses are used', async () => {
        const closedSessionError = new AppError("Email address not verified, please log in with a code", 401);
        vi.mocked(UsersRepository.getUser).mockRejectedValueOnce(closedSessionError);

        await expect(updateUser({ email: "new-address@test.fr", pseudo: CurrentUser.pseudo }, "current-jwt")).rejects.toBe(closedSessionError);

        expect(UsersRepository._getUserByEmail).not.toHaveBeenCalled();
        expect(UsersRepository.updateUserWithUnverifiedEmail).not.toHaveBeenCalled();
        expect(UsersRepository.logoutUser).not.toHaveBeenCalled();
        expect(sendEmailVerify).not.toHaveBeenCalled();
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
