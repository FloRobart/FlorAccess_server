import type { User, UserLoginBlock } from "../../../src/modules/users/users.types";

import AppConfig from "../../../src/config/AppConfig";
import { blockUserLogin, getUserLoginBlockPage } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";
import { AppError } from "../../../src/core/models/AppError.model";
import { buildUser } from "./users.fixtures";



/* The database, the hashing, the emails and the HTML pages are replaced, only the rules of the service are tested */
jest.mock("../../../src/modules/users/users.repository", () => ({
    _getUserById: jest.fn(),
    blockUserLogin: jest.fn(),
}));

jest.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: jest.fn(),
    hashString: jest.fn(),
    verifyHash: jest.fn(),
}));

jest.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: jest.fn(),
}));

jest.mock("../../../src/core/dispatcher/login.dispatcher", () => ({
    loginDispatcher: jest.fn(),
}));

jest.mock("../../../src/modules/users/users.email", () => ({
    sendEmailVerify: jest.fn(),
}));

jest.mock("../../../src/core/utils/jwt", () => ({
    generateJwt: jest.fn(),
    verifyJwt: jest.fn(),
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
 * Users service tests
 */
describe('Users service', () => {
    beforeEach(() => {
        jest.mocked(Securities.verifyHash).mockImplementation(async (input: string, hash: string) => hash === fakeHash(input));
        jest.mocked(UsersRepository.blockUserLogin).mockResolvedValue(true);

        /* The page is reduced to its status, which is enough to know which page was returned */
        jest.mocked(getEmailTemplate).mockImplementation(async (_templateName: string, variables: Record<string, string>) => variables.status);
    });


    /*=============*/
    /* Login block */
    /*=============*/
    describe('Login block', () => {
        it('Displays the email of the account on the confirmation page when the token is correct', async () => {
            const user: User = buildUser({ login_block_token_hash: fakeHash(BlockToken) });
            jest.mocked(UsersRepository._getUserById).mockResolvedValue(user);

            await getUserLoginBlockPage(LoginBlockLink);

            expect(getEmailTemplate).toHaveBeenCalledWith('login_block_confirmation', expect.objectContaining({ email: user.email }));
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Does not reveal the email of the account with a wrong token', async () => {
            const userWithOtherBlockToken: User = buildUser({ login_block_token_hash: fakeHash("other-token") });
            jest.mocked(UsersRepository._getUserById).mockResolvedValue(userWithOtherBlockToken);

            await expect(getUserLoginBlockPage(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(getEmailTemplate).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ email: expect.anything() }));
        });

        it('Blocks the logins without logging out when nobody used the login code', async () => {
            const userWithUnusedLoginCode: User = buildUser({
                login_block_token_hash: fakeHash(BlockToken),
                login_requested_at: new Date(),
            });
            jest.mocked(UsersRepository._getUserById).mockResolvedValue(userWithUnusedLoginCode);

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
            jest.mocked(UsersRepository._getUserById).mockResolvedValue(userWithUsedLoginCode);

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(BlockedPageStatus);
            expect(UsersRepository.blockUserLogin).toHaveBeenCalledWith(userWithUsedLoginCode.id, fakeHash(BlockToken), AppConfig.login_block_duration, true);
        });

        it('Does not block with a wrong token', async () => {
            const userWithOtherBlockToken: User = buildUser({ login_block_token_hash: fakeHash("other-token") });
            jest.mocked(UsersRepository._getUserById).mockResolvedValue(userWithOtherBlockToken);

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Does not block a user who has no block link', async () => {
            jest.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser());

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Returns the same page for an unknown user as for a wrong token', async () => {
            jest.mocked(UsersRepository._getUserById).mockRejectedValue(new AppError("User not found", 404));

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
            expect(UsersRepository.blockUserLogin).not.toHaveBeenCalled();
        });

        it('Returns the invalid link page when the block link was already used', async () => {
            jest.mocked(UsersRepository._getUserById).mockResolvedValue(buildUser({ login_block_token_hash: fakeHash(BlockToken) }));
            jest.mocked(UsersRepository.blockUserLogin).mockResolvedValue(false);

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(InvalidLinkPageStatus);
        });

        it('Returns the error page when the database fails', async () => {
            jest.mocked(UsersRepository._getUserById).mockRejectedValue(new AppError("Database unknown error"));

            await expect(blockUserLogin(LoginBlockLink)).resolves.toBe(ErrorPageStatus);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneMinute: number = 60 * 1000;
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
