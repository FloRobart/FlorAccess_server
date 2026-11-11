import type { User } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { insertUser, NEW_ACCOUNT_LIMIT_REACHED_MESSAGE } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import { sendEmailVerify } from "../../../src/modules/users/users.email";
import { generateJwt } from "../../../src/core/utils/jwt";
import logger from "../../../src/core/utils/logger";
import { AppError } from "../../../src/core/models/AppError.model";
import { assertEmailCanBeSent } from "../../../src/core/email/mailer";



const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/* The emails are only sent outside of the development environment */
vi.mock("../../../src/config/AppConfig", () => ({
    default: {
        app_env: "prod",
        app_name: "Floraccess",
        base_url: "http://localhost",
        new_account_daily_limit: 2,
    },
}));

/* The database, the hashing, the emails and the JWT are replaced, only the rules of the service are tested */
vi.mock("../../../src/modules/users/users.repository", () => ({
    insertUser: vi.fn(),
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
 * Verification email sent at the registration of a user
 */
describe('Verification email at registration', () => {
    /* Only the date is faked: the daily limit counts the accounts created during the last 24 hours */
    vi.useFakeTimers({ toFake: ['Date'] });

    beforeEach(() => {
        vi.mocked(Securities.generateApiToken).mockResolvedValue("email-verify-token");
        vi.mocked(Securities.hashToken).mockReturnValue("hashed-email-verify-token");
        vi.mocked(UsersRepository.insertUser).mockResolvedValue(InsertedUser);
        vi.mocked(sendEmailVerify).mockResolvedValue();

        /* Each test starts one day after the previous one, so that the accounts of the other tests do not count anymore */
        vi.setSystemTime(Date.now() + MILLISECONDS_PER_DAY);
    });

    afterAll(() => {
        vi.useRealTimers();
    });


    it('Registers the user and sends the verification email, without giving any JWT', async () => {
        await expect(insertUser(UserToInsert, null, "MyApp", null)).resolves.toBeUndefined();
        await waitForPendingPromises();

        expect(UsersRepository.insertUser).toHaveBeenCalledWith(UserToInsert, null, "hashed-email-verify-token");
        expect(sendEmailVerify).toHaveBeenCalledTimes(1);
        expect(generateJwt).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    it('Still registers the user when the email can not be sent, and logs the failure', async () => {
        const emailFailure = new AppError("Email sending failed", 500);
        vi.mocked(sendEmailVerify).mockRejectedValue(emailFailure);

        await expect(insertUser(UserToInsert, null, "MyApp", null)).resolves.toBeUndefined();
        await waitForPendingPromises();

        expect(logger.error).toHaveBeenCalledWith(expect.any(String), emailFailure);
    });

    it('Answers the same without sending any email when the address is already used, so that the route reveals no account', async () => {
        vi.mocked(UsersRepository.insertUser).mockResolvedValue(null);

        await expect(insertUser(UserToInsert, null, "MyApp", null)).resolves.toBeUndefined();
        await waitForPendingPromises();

        expect(sendEmailVerify).not.toHaveBeenCalled();
    });


    /*=========================*/
    /* Daily limit of accounts */
    /*=========================*/
    describe('Daily limit of new accounts', () => {
        it('Refuses the new accounts beyond the daily limit with a 503 error, before creating anything', async () => {
            await insertUser(UserToInsert, null, "MyApp", null);
            await insertUser(UserToInsert, null, "MyApp", null);

            await expect(insertUser(UserToInsert, null, "MyApp", null)).rejects.toMatchObject({ message: NEW_ACCOUNT_LIMIT_REACHED_MESSAGE, httpStatus: 503 });
            expect(UsersRepository.insertUser).toHaveBeenCalledTimes(2);
        });

        it('Does not count the registrations of addresses which were already used', async () => {
            vi.mocked(UsersRepository.insertUser).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
            await insertUser(UserToInsert, null, "MyApp", null);
            await insertUser(UserToInsert, null, "MyApp", null);

            await insertUser(UserToInsert, null, "MyApp", null);
            await insertUser(UserToInsert, null, "MyApp", null);

            await expect(insertUser(UserToInsert, null, "MyApp", null)).rejects.toMatchObject({ httpStatus: 503 });
        });

        it('Accepts new accounts again one day later', async () => {
            await insertUser(UserToInsert, null, "MyApp", null);
            await insertUser(UserToInsert, null, "MyApp", null);

            vi.setSystemTime(Date.now() + MILLISECONDS_PER_DAY + 1);

            await expect(insertUser(UserToInsert, null, "MyApp", null)).resolves.toBeUndefined();
        });

        it('Refuses the registration before creating anything when the daily limit of emails is reached', async () => {
            vi.mocked(assertEmailCanBeSent).mockImplementationOnce(() => { throw new AppError("Emails are temporarily unavailable", 503); });

            await expect(insertUser(UserToInsert, null, "MyApp", null)).rejects.toMatchObject({ httpStatus: 503 });
            expect(UsersRepository.insertUser).not.toHaveBeenCalled();
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const UserToInsert = {
    email: "test1@test.fr",
    pseudo: "Pseudo",
};

/* The type assertion keeps this fixture valid when other fields are added to the users */
const InsertedUser = {
    id: 1,
    email: UserToInsert.email,
    pseudo: UserToInsert.pseudo,

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: false,
    last_logout_at: new Date(),
    last_login: new Date(),
    last_ip: null,

    email_verify_token_hash: "hashed-email-verify-token",
    secret_hash: null,
    token_hash: null,

    is_admin: false,
    created_at: new Date(),
} as User;

/**
 * Lets the promises which are not awaited by the service finish, such as the sending of the email.
 */
function waitForPendingPromises(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}
