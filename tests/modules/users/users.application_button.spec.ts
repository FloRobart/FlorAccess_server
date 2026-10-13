import type { User, UserEmailVerification } from "../../../src/modules/users/users.types";

import { UserEmailVerify } from "../../../src/modules/users/users.service";
import * as UsersRepository from "../../../src/modules/users/users.repository";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";



/* The applications allowed to use the API are the origins of the CORS configuration */
jest.mock("../../../src/config/AppConfig", () => ({
    __esModule: true,
    default: {
        app_env: "dev",
        app_name: "Floraccess",
        base_url: "http://localhost",
        corsOptions: {
            origin: ["https://allowed.example.com", "http://localhost:26003", ""],
        },
    },
}));

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
 * Button of the email verification page which sends the user back to his application
 */
describe('Application button of the email verification page', () => {
    beforeEach(() => {
        jest.mocked(UsersRepository._getUserById).mockResolvedValue(VerifiedUser);

        /* The page is reduced to its button, which is the only part tested here */
        jest.mocked(getEmailTemplate).mockImplementation(async (_templateName, _variables, rawHtmlVariables) => rawHtmlVariables?.button ?? "");
    });


    it('Displays the button for the domain of an allowed application', async () => {
        const html = await UserEmailVerify({ ...EmailVerification, application: "Econoris", domain: "allowed.example.com" });

        expect(html).toBe(`<a class="btn" href="https://allowed.example.com">Aller sur Econoris</a>`);
    });

    it('Accepts an allowed domain written with another case, or with a port', async () => {
        await expect(UserEmailVerify({ ...EmailVerification, application: "Econoris", domain: "Allowed.Example.com" })).resolves.toContain("Aller sur Econoris");
        await expect(UserEmailVerify({ ...EmailVerification, application: "Econoris", domain: "localhost:26003" })).resolves.toContain("Aller sur Econoris");
    });

    it('Does not display the button for a domain which is not an allowed application', async () => {
        await expect(UserEmailVerify({ ...EmailVerification, application: "Econoris", domain: "evil.example" })).resolves.toBe("");
    });

    it('Does not display the button for a domain which tries to inject HTML', async () => {
        await expect(UserEmailVerify({ ...EmailVerification, application: "Econoris", domain: `"><script>alert(1)</script>` })).resolves.toBe("");
    });

    it('Does not display the button without application or without domain', async () => {
        await expect(UserEmailVerify({ ...EmailVerification, domain: "allowed.example.com" })).resolves.toBe("");
        await expect(UserEmailVerify({ ...EmailVerification, application: "Econoris" })).resolves.toBe("");
        await expect(UserEmailVerify({ ...EmailVerification, application: "Econoris", domain: "null" })).resolves.toBe("");
    });

    it('Escapes the name of the application', async () => {
        const html = await UserEmailVerify({ ...EmailVerification, application: `<img src=x onerror=alert(1)>`, domain: "allowed.example.com" });

        expect(html).toBe(`<a class="btn" href="https://allowed.example.com">Aller sur &lt;img src=x onerror=alert(1)&gt;</a>`);
    });
});


/*===========*/
/* Test data */
/*===========*/
const EmailVerification: UserEmailVerification = {
    userId: "1",
    token: "abcdef",
};

const VerifiedUser: User = {
    id: 1,
    email: "test1@test.fr",
    pseudo: "Pseudo",

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_logout_at: new Date(),
    last_login: new Date(),
    last_ip: null,

    email_verify_token_hash: null,
    secret_hash: null,
    token_hash: null,

    is_admin: false,
    created_at: new Date(),
};
