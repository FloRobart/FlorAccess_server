import type { User } from "../../../src/modules/users/users.types";

import { insertUser } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import * as Securities from "../../../src/core/utils/securities";
import { sendEmailVerify } from "../../../src/modules/users/users.email";
import { generateJwt } from "../../../src/core/utils/jwt";
import logger from "../../../src/core/utils/logger";
import { AppError } from "../../../src/core/models/AppError.model";



/* The emails are only sent outside of the development environment */
jest.mock("../../../src/config/AppConfig", () => ({
    __esModule: true,
    default: {
        app_env: "prod",
        app_name: "Floraccess",
        base_url: "http://localhost",
    },
}));

/* The database, the hashing, the emails and the JWT are replaced, only the rules of the service are tested */
jest.mock("../../../src/modules/users/users.repository", () => ({
    insertUser: jest.fn(),
}));

jest.mock("../../../src/core/utils/securities", () => ({
    generateApiToken: jest.fn(),
    hashString: jest.fn(),
    verifyHash: jest.fn(),
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

jest.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: jest.fn(),
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
 * Verification email sent at the registration of a user
 */
describe('Verification email at registration', () => {
    beforeEach(() => {
        jest.mocked(Securities.generateApiToken).mockResolvedValue("email-verify-token");
        jest.mocked(Securities.hashString).mockResolvedValue("hashed-email-verify-token");
        jest.mocked(UsersRepository.insertUser).mockResolvedValue(InsertedUser);
        jest.mocked(generateJwt).mockResolvedValue(SignedJwt);
    });


    it('Registers the user and sends the verification email', async () => {
        jest.mocked(sendEmailVerify).mockResolvedValue();

        await expect(insertUser(UserToInsert, null, "MyApp", null)).resolves.toBe(SignedJwt);
        await waitForPendingPromises();

        expect(sendEmailVerify).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
    });

    it('Still registers the user when the email can not be sent, and logs the failure', async () => {
        const emailFailure = new AppError("Email sending failed", 500);
        jest.mocked(sendEmailVerify).mockRejectedValue(emailFailure);

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
