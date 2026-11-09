import type { User } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { insertUser } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import { sendEmailVerify } from "../../../src/modules/users/users.email";
import { generateJwt } from "../../../src/core/utils/jwt";
import logger from "../../../src/core/utils/logger";
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
    insertUser: vi.fn(),
}));

vi.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: vi.fn(),
    hashString: vi.fn(),
    verifyHash: vi.fn(),
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
    beforeEach(() => {
        vi.mocked(Securities.generateApiToken).mockResolvedValue("email-verify-token");
        vi.mocked(Securities.hashString).mockResolvedValue("hashed-email-verify-token");
        vi.mocked(UsersRepository.insertUser).mockResolvedValue(InsertedUser);
        vi.mocked(generateJwt).mockResolvedValue(SignedJwt);
    });


    it('Registers the user and sends the verification email', async () => {
        vi.mocked(sendEmailVerify).mockResolvedValue();

        await expect(insertUser(UserToInsert, null, "MyApp", null)).resolves.toBe(SignedJwt);
        await waitForPendingPromises();

        expect(sendEmailVerify).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
    });

    it('Still registers the user when the email can not be sent, and logs the failure', async () => {
        const emailFailure = new AppError("Email sending failed", 500);
        vi.mocked(sendEmailVerify).mockRejectedValue(emailFailure);

        await expect(insertUser(UserToInsert, null, "MyApp", null)).resolves.toBe(SignedJwt);
        await waitForPendingPromises();

        expect(logger.error).toHaveBeenCalledWith(expect.any(String), emailFailure);
    });
});


/*===========*/
/* Test data */
/*===========*/
const SignedJwt: string = "signed-jwt";

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
