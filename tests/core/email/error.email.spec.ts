jest.mock("../../../src/config/AppConfig", () => ({
    __esModule: true,
    default: {
        app_name: "Floraccess",
        mail_username: "admin@test.fr",
        error_email_cooldown: 15 * 60 * 1000,
    },
}));

/* No email is really sent, and the template is reduced to the error message it receives */
jest.mock("../../../src/core/email/mailer", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: jest.fn(async (_templateName: string, variables: Record<string, string>) => variables.errorMessage),
}));



/**
 * Error email tests
 */
describe('Error email', () => {
    let sendErrorEmail: (...args: any[]) => Promise<boolean>;
    let sendEmail: jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));

        /* The module remembers when it sent its last email : it is loaded again so that each test starts without cooldown */
        jest.resetModules();
        sendErrorEmail = require("../../../src/core/email/error.email").sendErrorEmail;
        sendEmail = require("../../../src/core/email/mailer").default;
        sendEmail.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.useRealTimers();
    });


    it('Sends the first error by email', async () => {
        await expect(sendErrorEmail("Database unknown error")).resolves.toBe(true);

        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail).toHaveBeenCalledWith("admin@test.fr", expect.any(String), "Database unknown error");
    });

    it('Does not send the errors which follow during the cooldown', async () => {
        await sendErrorEmail("First error");

        jest.advanceTimersByTime(OneMinute);
        await expect(sendErrorEmail("Second error")).resolves.toBe(false);
        await expect(sendErrorEmail("Third error")).resolves.toBe(false);

        expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('Sends an email again after the cooldown, with the number of errors which were not sent', async () => {
        await sendErrorEmail("First error");
        await sendErrorEmail("Second error");
        await sendErrorEmail("Third error");

        jest.advanceTimersByTime(16 * OneMinute);
        await expect(sendErrorEmail("Fourth error")).resolves.toBe(true);

        expect(sendEmail).toHaveBeenCalledTimes(2);
        expect(sendEmail).toHaveBeenLastCalledWith("admin@test.fr", expect.any(String), expect.stringMatching(/^2 autre\(s\) erreur\(s\)[\s\S]*Fourth error$/));
    });

    it('Does not call a failing mail server again for each error', async () => {
        sendEmail.mockRejectedValue(new Error("Email sending failed"));

        await expect(sendErrorEmail("First error")).rejects.toThrow("Email sending failed");
        await expect(sendErrorEmail("Second error")).resolves.toBe(false);

        expect(sendEmail).toHaveBeenCalledTimes(1);
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneMinute: number = 60 * 1000;
