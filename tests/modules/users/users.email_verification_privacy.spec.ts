import type { User, UserEmailVerification } from "../../../src/modules/users/users.types";

import { UserEmailVerify } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";



/* The database, the hashing, the emails and the HTML pages are replaced, only the rules of the service are tested */
jest.mock("../../../src/modules/users/users.repository", () => ({
    _getUserById: jest.fn(),
    UserEmailVerify: jest.fn(),
}));

jest.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: jest.fn(),
    hashString: jest.fn(),
    verifyHash: jest.fn(),
}));

jest.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: jest.fn(),
}));

jest.mock("../../../src/modules/users/users.email", () => ({
    sendEmailVerify: jest.fn(),
}));

jest.mock("../../../src/core/utils/jwt", () => ({
    generateJwt: jest.fn(),
    verifyJwt: jest.fn(),
}));

jest.mock("../../../src/core/dispatcher/login.dispatcher", () => ({
    loginDispatcher: jest.fn(),
}));

jest.mock("../../../src/core/utils/logger", () => ({
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
 * Email address displayed by the email verification page
 */
describe('Email address on the email verification page', () => {
    beforeEach(() => {
        jest.mocked(Securities.verifyHash).mockImplementation(async (input: string, hash: string) => hash === `hash:${input}`);
        jest.mocked(getEmailTemplate).mockResolvedValue("<html></html>");
    });


    it('Does not display the email address of an already verified user, whose token can not be checked anymore', async () => {
        jest.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: true, email_verify_token_hash: null }));

        await UserEmailVerify(LinkWithWrongToken);

        expect(getTextGivenToThePage()).not.toContain(UserEmail);
    });

    it('Does not display the email address of an unverified user when the token is wrong', async () => {
        jest.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: false, email_verify_token_hash: `hash:${ValidToken}` }));

        await UserEmailVerify(LinkWithWrongToken);

        expect(getTextGivenToThePage()).not.toContain(UserEmail);
        expect(UsersRepository.UserEmailVerify).not.toHaveBeenCalled();
    });

    it('Displays the email address to the owner of the link, when the token is correct', async () => {
        jest.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ is_verified_email: false, email_verify_token_hash: `hash:${ValidToken}` }));

        await UserEmailVerify({ userId: "1", token: ValidToken });

        expect(getTextGivenToThePage()).toContain(UserEmail);
        expect(UsersRepository.UserEmailVerify).toHaveBeenCalledWith(1);
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
    return JSON.stringify(jest.mocked(getEmailTemplate).mock.calls);
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
