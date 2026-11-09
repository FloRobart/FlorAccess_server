import type { User, UserSafe } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as AdminsService from "../../../src/modules/admins/admins.service";
import * as AdminsRepository from "../../../src/modules/admins/admins.repository";
import * as UsersService from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import { verifyJwt } from "../../../src/core/utils/jwt";
import sendEmail from "../../../src/core/email/mailer";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";
import { AppError } from "../../../src/core/models/AppError.model";
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
    deleteUser: vi.fn(),
}));

vi.mock("../../../src/modules/users/users.service", () => ({
    insertUser: vi.fn(),
    sendVerificationEmail: vi.fn(),
}));

vi.mock("../../../src/modules/users/users.repository", () => ({
    getUser: vi.fn(),
    _getUserById: vi.fn(),
    updateUserEmailVerifyTokenHash: vi.fn(),
}));

vi.mock("../../../src/core/utils/jwt", () => ({
    verifyJwt: vi.fn(),
}));

vi.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    hashString: vi.fn(),
}));

vi.mock("../../../src/core/email/mailer", () => ({
    default: vi.fn(),
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
            vi.mocked(UsersService.insertUser).mockResolvedValue(SignedJwt);
            vi.mocked(verifyJwt).mockReturnValue(JwtUser);
            vi.mocked(UsersRepository.getUser).mockResolvedValue(StoredUser);
            vi.mocked(AdminsRepository.updateUser).mockResolvedValue(LoggedOutUser);
        });


        it('Registers the user like a registration from the API, then logs him out', async () => {
            const userAdmin = await AdminsService.insertUser(UserToInsert, "Floraccess");

            expect(UsersService.insertUser).toHaveBeenCalledWith(UserToInsert, null, "Floraccess", null);
            expect(AdminsRepository.updateUser).toHaveBeenCalledWith({ is_connected: false }, StoredUser);
            expect(userAdmin).toMatchObject({ id: LoggedOutUser.id, is_connected: false });
            expect(userAdmin).not.toHaveProperty("secret_hash");
        });

        it('Fails with a 500 error when the stored user is not valid', async () => {
            vi.mocked(AdminsRepository.updateUser).mockResolvedValue(buildUser());

            await expect(AdminsService.insertUser(UserToInsert, "Floraccess")).rejects.toMatchObject({ message: 'Data validation error', httpStatus: 500 });
        });

        it('Gives an application error to the caller', async () => {
            const conflictError = new AppError("Failed to create user", 500);
            vi.mocked(UsersService.insertUser).mockRejectedValue(conflictError);

            await expect(AdminsService.insertUser(UserToInsert, "Floraccess")).rejects.toBe(conflictError);
        });

        it('Hides an unknown error behind a 500 error', async () => {
            vi.mocked(UsersService.insertUser).mockRejectedValue(new Error("Unknown"));

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
            vi.mocked(Securities.hashString).mockImplementation(async (input: string) => `hash:${input}`);
        });


        it('Stores a new verification token for each user and sends it to him', async () => {
            await expect(AdminsService.sendVerifyEmail([1, 2])).resolves.toStrictEqual([1, 2]);

            expect(UsersRepository.updateUserEmailVerifyTokenHash).toHaveBeenCalledWith(1, `hash:${EmailVerifyToken}`);
            expect(UsersService.sendVerificationEmail).toHaveBeenCalledWith(2, "user2@test.fr", EmailVerifyToken);
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
const SignedJwt: string = "signed-jwt";
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
