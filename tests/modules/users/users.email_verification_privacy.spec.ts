import type { User, UserEmailVerification } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserEmailVerify } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";
import { AppError } from "../../../src/core/models/AppError.model";



/* The database, the hashing, the emails and the HTML pages are replaced, only the rules of the service are tested */
vi.mock("../../../src/modules/users/users.repository", () => ({
    _getUserById: vi.fn(),
    UserEmailVerify: vi.fn(),
}));

vi.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    hashString: vi.fn(),
    verifyHash: vi.fn(),
    hashToken: vi.fn(),
    verifyToken: vi.fn(),
}));

vi.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: vi.fn(),
}));

vi.mock("../../../src/modules/users/users.email", () => ({
    sendEmailVerify: vi.fn(),
}));

vi.mock("../../../src/core/utils/jwt", () => ({
    generateJwt: vi.fn(),
    verifyJwt: vi.fn(),
}));

vi.mock("../../../src/core/dispatcher/login.dispatcher", () => ({
    loginDispatcher: vi.fn(),
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
 * Email address displayed by the email verification page
 */
describe('Email address on the email verification page', () => {
    beforeEach(() => {
        vi.mocked(Securities.verifyToken).mockImplementation(async (input: string, hash: string) => hash === `hash:${input}`);
        vi.mocked(getEmailTemplate).mockResolvedValue("<html></html>");
    });


    it('Does not display the email address of an already verified user, whose token can not be checked anymore', async () => {
        vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: true, email_verify_token_hash: null }));

        await UserEmailVerify(LinkWithWrongToken);

        expect(getTextGivenToThePage()).not.toContain(UserEmail);
    });

    it('Does not display the email address of an unverified user when the token is wrong', async () => {
        vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: false, email_verify_token_hash: `hash:${ValidToken}` }));

        await UserEmailVerify(LinkWithWrongToken);

        expect(getTextGivenToThePage()).not.toContain(UserEmail);
        expect(UsersRepository.UserEmailVerify).not.toHaveBeenCalled();
    });

    it('Displays the email address to the owner of the link, when the token is correct', async () => {
        vi.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: false, email_verify_token_hash: `hash:${ValidToken}` }));

        await UserEmailVerify({ userId: "1", token: ValidToken });

        expect(getTextGivenToThePage()).toContain(UserEmail);
        expect(UsersRepository.UserEmailVerify).toHaveBeenCalledWith(1);
    });

    it('Displays the same page for an unknown user, an address already verified and a wrong token, so that the links reveal no account', async () => {
        vi.mocked(UsersRepository._getUserById).mockRejectedValueOnce(new AppError("User not found", 404));
        await UserEmailVerify(LinkWithWrongToken);

        vi.mocked(UsersRepository._getUserById).mockResolvedValueOnce(buildUser({ is_verified_email: true, email_verify_token_hash: `hash:${ValidToken}` }));
        await UserEmailVerify({ userId: "1", token: ValidToken });

        vi.mocked(UsersRepository._getUserById).mockResolvedValueOnce(buildUser({ is_verified_email: false, email_verify_token_hash: `hash:${ValidToken}` }));
        await UserEmailVerify(LinkWithWrongToken);

        vi.mocked(UsersRepository._getUserById).mockResolvedValueOnce(buildUser({ is_verified_email: false, email_verify_token_hash: null }));
        await UserEmailVerify(LinkWithWrongToken);

        const pages = vi.mocked(getEmailTemplate).mock.calls;
        expect(pages).toHaveLength(4);
        expect(pages[0]).toStrictEqual(['verification_email_error', { status: "Lien invalide", message: expect.any(String) }, { button: "" }]);
        expect(pages[1]).toStrictEqual(pages[0]);
        expect(pages[2]).toStrictEqual(pages[0]);
        expect(pages[3]).toStrictEqual(pages[0]);
        expect(UsersRepository.UserEmailVerify).not.toHaveBeenCalled();
    });
});


/*===========*/
/* Test data */
/*===========*/
const UserEmail: string = "private-address@test.fr";
const ValidToken: string = "abcdef0123456789";

const LinkWithWrongToken: UserEmailVerification = {
    userId: "1",
    token: "a",
};

/**
 * Gathers everything the service gave to the HTML page, whatever the arguments used to give it.
 * @returns Text of all the values given to the page
 */
function getTextGivenToThePage(): string {
    return JSON.stringify(vi.mocked(getEmailTemplate).mock.calls);
}

/**
 * Builds a user for the tests.
 *
 * The type assertion keeps this fixture valid when other fields are added to the users.
 * @param overrides Fields which replace the default ones
 * @returns User object
 */
function buildUser(overrides: Partial<User>): User {
    return {
        id: 1,
        email: UserEmail,
        pseudo: "Pseudo",

        auth_methods_id: 1,
        is_connected: true,
        is_verified_email: false,
        last_logout_at: new Date(),
        last_login: new Date(),
        last_ip: null,

        email_verify_token_hash: null,
        secret_hash: null,
        token_hash: null,

        is_admin: false,
        created_at: new Date(),

        ...overrides,
    } as User;
}
