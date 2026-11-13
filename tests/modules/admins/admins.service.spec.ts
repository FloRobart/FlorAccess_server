import type { User, UserSafe } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as AdminsService from "../../../src/modules/admins/admins.service";
import * as AdminsRepository from "../../../src/modules/admins/admins.repository";
import * as UsersService from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import sendEmail, { assertAdminEmailsCanBeSent, assertEmailCanBeSent } from "../../../src/core/email/mailer";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";
import { AppError } from "../../../src/core/models/AppError.model";
import logger from "../../../src/core/utils/logger";
import { buildUser } from "../users/users.fixtures";



/* The emails are only sent outside of the development environment : each test chooses its own */
const { mockedAppConfig } = vi.hoisted(() => ({
    mockedAppConfig: { app_env: "dev", app_name: "Floraccess" },
}));

vi.mock("../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));

/* The database, the users module, the hashing, the emails and the JWT are replaced, only the rules of the service are tested */
vi.mock("../../../src/modules/admins/admins.repository", () => ({
    isAdmin: vi.fn(),
    selectUsers: vi.fn(),
    countUsers: vi.fn(),
    updateUser: vi.fn(),
    unblockUserLogin: vi.fn(),
    deleteUser: vi.fn(),
}));

vi.mock("../../../src/modules/users/users.service", () => ({
    createUserAndSendVerificationEmail: vi.fn(),
    sendVerificationEmail: vi.fn(),
}));

vi.mock("../../../src/modules/users/users.repository", () => ({
    _getUserById: vi.fn(),
    updateUserEmailVerifyTokenHash: vi.fn(),
}));

vi.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    hashToken: vi.fn(),
}));

/* The daily limit of emails is tested with the mailer, each test here chooses if it is reached */
vi.mock("../../../src/core/email/mailer", () => ({
    default: vi.fn(),
    assertEmailCanBeSent: vi.fn(),
    assertAdminEmailsCanBeSent: vi.fn(),
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
 * Administrators service tests
 */
describe('Administrators service', () => {
    beforeEach(() => {
        mockedAppConfig.app_env = "dev";

        /* The service writes debug logs directly in the console */
        vi.spyOn(console, 'debug').mockImplementation(() => {});
    });


    /*================*/
    /* Administrators */
    /*================*/
    describe('Administrator check', () => {
        it('Asks the database if the user is an administrator', async () => {
            vi.mocked(AdminsRepository.isAdmin).mockResolvedValue(true);

            await expect(AdminsService.isAdmin(JwtUser)).resolves.toBe(true);
            expect(AdminsRepository.isAdmin).toHaveBeenCalledWith(JwtUser);
        });

        it('Gives the failure of the check to the caller', async () => {
            const notConnectedError = new AppError("User is not connected", 401);
            vi.mocked(AdminsRepository.isAdmin).mockImplementation(() => { throw notConnectedError; });

            await expect(AdminsService.isAdmin(JwtUser)).rejects.toBe(notConnectedError);
        });
    });


    /*========*/
    /* INSERT */
    /*========*/
    describe('Registration of a user', () => {
        beforeEach(() => {
            vi.mocked(UsersService.createUserAndSendVerificationEmail).mockResolvedValue(StoredUser);
            vi.mocked(AdminsRepository.updateUser).mockResolvedValue(LoggedOutUser);
        });


        it('Registers the user like a registration from the API, then logs him out', async () => {
            const userAdmin = await AdminsService.insertUser(UserToInsert, "Floraccess");

            expect(UsersService.createUserAndSendVerificationEmail).toHaveBeenCalledWith(UserToInsert, null, "Floraccess", null);
            expect(AdminsRepository.updateUser).toHaveBeenCalledWith({ is_connected: false }, StoredUser);
            expect(userAdmin).toMatchObject({ id: LoggedOutUser.id, is_connected: false });
            expect(userAdmin).not.toHaveProperty("secret_hash");
        });

        it('Fails with a 409 error when the email address is already used', async () => {
            vi.mocked(UsersService.createUserAndSendVerificationEmail).mockResolvedValue(null);

            await expect(AdminsService.insertUser(UserToInsert, "Floraccess")).rejects.toMatchObject({ message: 'A user with this email already exists', httpStatus: 409 });
            expect(AdminsRepository.updateUser).not.toHaveBeenCalled();
        });

        it('Creates nothing when the emails left for the administrators are used up', async () => {
            vi.mocked(assertAdminEmailsCanBeSent).mockImplementationOnce(() => { throw new AppError("Not enough emails left for this sending", 503); });

            await expect(AdminsService.insertUser(UserToInsert, "Floraccess")).rejects.toMatchObject({ httpStatus: 503 });
            expect(assertAdminEmailsCanBeSent).toHaveBeenCalledWith(1);
            expect(UsersService.createUserAndSendVerificationEmail).not.toHaveBeenCalled();
        });

        it('Fails with a 500 error when the stored user is not valid', async () => {
            vi.mocked(AdminsRepository.updateUser).mockResolvedValue(buildUser());

            await expect(AdminsService.insertUser(UserToInsert, "Floraccess")).rejects.toMatchObject({ message: 'Data validation error', httpStatus: 500 });
        });

        it('Gives an application error to the caller', async () => {
            const databaseError = new AppError("Database unknown error", 500);
            vi.mocked(UsersService.createUserAndSendVerificationEmail).mockRejectedValue(databaseError);

            await expect(AdminsService.insertUser(UserToInsert, "Floraccess")).rejects.toBe(databaseError);
        });

        it('Hides an unknown error behind a 500 error', async () => {
            vi.mocked(UsersService.createUserAndSendVerificationEmail).mockRejectedValue(new Error("Unknown"));

            await expect(AdminsService.insertUser(UserToInsert, "Floraccess")).rejects.toMatchObject({ message: 'Unknown error in admin insertUser', httpStatus: 500 });
        });
    });


    /*========*/
    /* SELECT */
    /*========*/
    describe('Selection of the users', () => {
        it('Returns the users without their secrets', async () => {
            vi.mocked(AdminsRepository.selectUsers).mockResolvedValue([LoggedOutUser]);

            const users = await AdminsService.selectUsers(QueryParams);

            expect(AdminsRepository.selectUsers).toHaveBeenCalledWith(QueryParams);
            expect(users).toHaveLength(1);
            expect(users[0]).not.toHaveProperty("secret_hash");
        });

        it('Fails with a 500 error when a stored user is not valid', async () => {
            vi.mocked(AdminsRepository.selectUsers).mockResolvedValue([buildUser()]);

            await expect(AdminsService.selectUsers(QueryParams)).rejects.toMatchObject({ message: 'Data validation error', httpStatus: 500 });
        });

        it('Gives an application error to the caller', async () => {
            const databaseError = new AppError("Database unknown error");
            vi.mocked(AdminsRepository.selectUsers).mockRejectedValue(databaseError);

            await expect(AdminsService.selectUsers(QueryParams)).rejects.toBe(databaseError);
        });

        it('Hides an unknown error behind a 500 error', async () => {
            vi.mocked(AdminsRepository.selectUsers).mockRejectedValue(new Error("Unknown"));

            await expect(AdminsService.selectUsers(QueryParams)).rejects.toMatchObject({ message: 'Unknown error in admin selectUsers' });
        });

        it('Counts the users', async () => {
            vi.mocked(AdminsRepository.countUsers).mockResolvedValue(42);

            await expect(AdminsService.countUsers()).resolves.toBe(42);
        });

        it('Gives an application error of the count to the caller, and hides an unknown one', async () => {
            const databaseError = new AppError("Database unknown error");
            vi.mocked(AdminsRepository.countUsers).mockRejectedValueOnce(databaseError);
            await expect(AdminsService.countUsers()).rejects.toBe(databaseError);

            vi.mocked(AdminsRepository.countUsers).mockRejectedValueOnce(new Error("Unknown"));
            await expect(AdminsService.countUsers()).rejects.toMatchObject({ message: 'Unknown error in admin countUsers' });
        });
    });


    /*========*/
    /* UPDATE */
    /*========*/
    describe('Update of a user', () => {
        beforeEach(() => {
            vi.mocked(UsersRepository._getUserById).mockResolvedValue(StoredUser);
        });


        it('Updates the current version of the user and returns him without his secrets', async () => {
            vi.mocked(AdminsRepository.updateUser).mockResolvedValue(LoggedOutUser);

            const userAdmin = await AdminsService.updateUser(1, { is_connected: false });

            expect(UsersRepository._getUserById).toHaveBeenCalledWith(1);
            expect(AdminsRepository.updateUser).toHaveBeenCalledWith({ is_connected: false }, StoredUser);
            expect(userAdmin).toMatchObject({ is_connected: false });
        });

        it('Fails with a 500 error when the updated user is not valid', async () => {
            vi.mocked(AdminsRepository.updateUser).mockResolvedValue(buildUser());

            await expect(AdminsService.updateUser(1, {})).rejects.toMatchObject({ message: 'Data validation error' });
        });

        it('Gives an application error to the caller', async () => {
            const notFoundError = new AppError("User not found", 404);
            vi.mocked(UsersRepository._getUserById).mockRejectedValue(notFoundError);

            await expect(AdminsService.updateUser(404, {})).rejects.toBe(notFoundError);
        });

        it('Hides an unknown error behind a 500 error', async () => {
            vi.mocked(UsersRepository._getUserById).mockRejectedValue(new Error("Unknown"));

            await expect(AdminsService.updateUser(1, {})).rejects.toMatchObject({ message: 'Unknown error in admin updateUser' });
        });
    });

    describe('Unblock of the logins of a user', () => {
        it('Unblocks the logins of the user and returns him without his secrets', async () => {
            vi.mocked(AdminsRepository.unblockUserLogin).mockResolvedValue(LoggedOutUser);

            const userAdmin = await AdminsService.unblockUserLogin(1);

            expect(AdminsRepository.unblockUserLogin).toHaveBeenCalledWith(1);
            expect(userAdmin).toMatchObject({ id: LoggedOutUser.id, login_blocked_until: null });
            expect(userAdmin).not.toHaveProperty("secret_hash");
        });

        it('Writes the unblock in the logs with the identifier of the user, never with his email address', async () => {
            vi.mocked(AdminsRepository.unblockUserLogin).mockResolvedValue(LoggedOutUser);

            await AdminsService.unblockUserLogin(1);

            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("user-1"));
            expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining(LoggedOutUser.email));
        });

        it('Fails with a 500 error when the unblocked user is not valid', async () => {
            vi.mocked(AdminsRepository.unblockUserLogin).mockResolvedValue(buildUser());

            await expect(AdminsService.unblockUserLogin(1)).rejects.toMatchObject({ message: 'Data validation error', httpStatus: 500 });
        });

        it('Gives an application error to the caller, and hides an unknown one', async () => {
            const notFoundError = new AppError("User not found", 404);
            vi.mocked(AdminsRepository.unblockUserLogin).mockRejectedValueOnce(notFoundError);
            await expect(AdminsService.unblockUserLogin(404)).rejects.toBe(notFoundError);

            vi.mocked(AdminsRepository.unblockUserLogin).mockRejectedValueOnce(new Error("Unknown"));
            await expect(AdminsService.unblockUserLogin(1)).rejects.toMatchObject({ message: 'Unknown error in admin unblockUserLogin', httpStatus: 500 });
        });
    });


    /*========*/
    /* DELETE */
    /*========*/
    describe('Deletion of a user', () => {
        it('Deletes the user', async () => {
            vi.mocked(AdminsRepository.deleteUser).mockResolvedValue();

            await expect(AdminsService.deleteUser(1)).resolves.toBeUndefined();
            expect(AdminsRepository.deleteUser).toHaveBeenCalledWith(1);
        });

        it('Gives an application error to the caller, and hides an unknown one', async () => {
            const notFoundError = new AppError("User not found", 404);
            vi.mocked(AdminsRepository.deleteUser).mockRejectedValueOnce(notFoundError);
            await expect(AdminsService.deleteUser(404)).rejects.toBe(notFoundError);

            vi.mocked(AdminsRepository.deleteUser).mockRejectedValueOnce(new Error("Unknown"));
            await expect(AdminsService.deleteUser(1)).rejects.toMatchObject({ message: 'Unknown error in admin deleteUser' });
        });
    });


    /*=======*/
    /* Email */
    /*=======*/
    describe('Verification email', () => {
        beforeEach(() => {
            vi.mocked(UsersRepository._getUserById).mockImplementation(async (userId: number) => buildUser({ id: userId, email: `user${userId}@test.fr` }));
            vi.mocked(Securities.generateApiToken).mockResolvedValue(EmailVerifyToken);
            vi.mocked(Securities.hashToken).mockImplementation((input: string) => `hash:${input}`);
        });


        it('Stores a new verification token for each user and sends it to him', async () => {
            await expect(AdminsService.sendVerifyEmail([1, 2])).resolves.toStrictEqual([1, 2]);

            expect(UsersRepository.updateUserEmailVerifyTokenHash).toHaveBeenCalledWith(1, `hash:${EmailVerifyToken}`);
            expect(UsersService.sendVerificationEmail).toHaveBeenCalledWith(2, "user2@test.fr", EmailVerifyToken);
        });

        it('Keeps the current link of the user when the daily limit of emails is reached', async () => {
            vi.mocked(assertEmailCanBeSent).mockImplementationOnce(() => { throw new AppError("Emails are temporarily unavailable", 503); });

            await expect(AdminsService.sendVerifyEmail([1])).rejects.toMatchObject({ httpStatus: 503 });
            expect(UsersRepository.updateUserEmailVerifyTokenHash).not.toHaveBeenCalled();
        });

        it('Checks the emails left for the whole list before the first email, and sends none when they are not enough', async () => {
            vi.mocked(assertAdminEmailsCanBeSent).mockImplementationOnce(() => { throw new AppError("Not enough emails left for this sending", 503); });

            await expect(AdminsService.sendVerifyEmail([1, 2])).rejects.toMatchObject({ httpStatus: 503 });
            expect(assertAdminEmailsCanBeSent).toHaveBeenCalledWith(2);
            expect(UsersRepository.updateUserEmailVerifyTokenHash).not.toHaveBeenCalled();
            expect(UsersService.sendVerificationEmail).not.toHaveBeenCalled();
        });

        it('Sends nothing when one of the users does not exist', async () => {
            vi.mocked(UsersRepository._getUserById).mockImplementation(async (userId: number) => {
                if (userId === 404) { throw new AppError("User not found", 404); }
                return buildUser({ id: userId });
            });

            await expect(AdminsService.sendVerifyEmail([1, 404])).rejects.toMatchObject({ httpStatus: 404 });
            expect(UsersService.sendVerificationEmail).not.toHaveBeenCalled();
        });

        it('Gives an application error to the caller', async () => {
            const notFoundError = new AppError("User not found", 404);
            vi.mocked(UsersRepository._getUserById).mockRejectedValue(notFoundError);

            await expect(AdminsService.sendVerifyEmail([404])).rejects.toBe(notFoundError);
        });

        it('Hides an unknown error behind a 500 error', async () => {
            vi.mocked(UsersService.sendVerificationEmail).mockRejectedValue(new Error("Unknown"));

            await expect(AdminsService.sendVerifyEmail([1])).rejects.toMatchObject({ message: 'Unknown error in admin sendVerifyEmail' });
        });
    });

    describe('Email from the administrators', () => {
        beforeEach(() => {
            vi.mocked(UsersRepository._getUserById).mockImplementation(async (userId: number) => buildUser({ id: userId, email: `user${userId}@test.fr` }));
            vi.mocked(getEmailTemplate).mockResolvedValue(EmailHtml);
        });


        it('Sends the email to each user outside of the development environment', async () => {
            mockedAppConfig.app_env = "prod";

            await expect(AdminsService.sendEmailAdmin(EmailAdmin)).resolves.toStrictEqual([1, 2]);

            expect(getEmailTemplate).toHaveBeenCalledWith("email_from_admin_template", {
                object: EmailAdmin.object,
                message: EmailAdmin.message,
                currentYear: String(new Date().getFullYear()),
            });
            expect(sendEmail).toHaveBeenCalledWith("user1@test.fr", EmailAdmin.object, EmailHtml);
            expect(sendEmail).toHaveBeenCalledWith("user2@test.fr", EmailAdmin.object, EmailHtml);
        });

        it('Does not send the email in the development environment', async () => {
            await expect(AdminsService.sendEmailAdmin(EmailAdmin)).resolves.toStrictEqual([1, 2]);

            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('Checks the emails left for the whole list before the first email, and sends none when they are not enough', async () => {
            mockedAppConfig.app_env = "prod";
            vi.mocked(assertAdminEmailsCanBeSent).mockImplementationOnce(() => { throw new AppError("Not enough emails left for this sending", 503); });

            await expect(AdminsService.sendEmailAdmin(EmailAdmin)).rejects.toMatchObject({ httpStatus: 503 });
            expect(assertAdminEmailsCanBeSent).toHaveBeenCalledWith(EmailAdmin.userIdList.length);
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('Sends nothing when one of the users does not exist', async () => {
            mockedAppConfig.app_env = "prod";
            vi.mocked(UsersRepository._getUserById).mockImplementation(async (userId: number) => {
                if (userId === 2) { throw new AppError("User not found", 404); }
                return buildUser({ id: userId });
            });

            await expect(AdminsService.sendEmailAdmin(EmailAdmin)).rejects.toMatchObject({ httpStatus: 404 });
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('Gives an application error to the caller, and hides an unknown one', async () => {
            const notFoundError = new AppError("User not found", 404);
            vi.mocked(UsersRepository._getUserById).mockRejectedValueOnce(notFoundError);
            await expect(AdminsService.sendEmailAdmin(EmailAdmin)).rejects.toBe(notFoundError);

            vi.mocked(UsersRepository._getUserById).mockRejectedValueOnce(new Error("Unknown"));
            await expect(AdminsService.sendEmailAdmin(EmailAdmin)).rejects.toMatchObject({ message: 'Unknown error in sendEmailAdmin' });
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const EmailVerifyToken: string = "abcdef0123456789";
const EmailHtml: string = "<html>email</html>";
const QueryParams = { limit: 10, offset: 0 };

const UserToInsert = {
    email: "test1@test.fr",
    pseudo: "Pseudo",
};

const EmailAdmin = {
    userIdList: [1, 2],
    object: "Maintenance",
    message: "The API will be stopped tonight.",
};

const StoredUser: User = buildUser();

/* The users read by the administrators also carry their update date */
const LoggedOutUser = { ...buildUser({ is_connected: false, secret_hash: "secret" }), updated_at: new Date() } as User;

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
