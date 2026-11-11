import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";



vi.mock("../../../src/config/AppConfig", () => ({
    default: {
        app_name: "Floraccess",
        mail_username: "admin@test.fr",
        error_email_cooldown: 15 * 60 * 1000,
    },
}));

/* No email is really sent (the error emails use the alert sending, outside of the daily limit), and the template is reduced to the error message it receives */
vi.mock("../../../src/core/email/mailer", () => ({
    sendAlertEmail: vi.fn(),
}));

vi.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: vi.fn(async (_templateName: string, variables: Record<string, string>) => variables.errorMessage),
}));



/**
 * Error email tests
 */
describe('Error email', () => {
    let sendErrorEmail: (...args: any[]) => Promise<boolean>;
    let sendAlertEmail: Mock;

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));

        /* The module remembers when it sent its last email : it is loaded again so that each test starts without cooldown */
        vi.resetModules();
        sendErrorEmail = (await import("../../../src/core/email/error.email")).sendErrorEmail;
        sendAlertEmail = vi.mocked((await import("../../../src/core/email/mailer")).sendAlertEmail);
        sendAlertEmail.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });


    it('Sends the first error by email', async () => {
        await expect(sendErrorEmail("Database unknown error")).resolves.toBe(true);

        expect(sendAlertEmail).toHaveBeenCalledTimes(1);
        expect(sendAlertEmail).toHaveBeenCalledWith("admin@test.fr", expect.any(String), "Database unknown error");
    });

    it('Writes the values which are not texts as JSON', async () => {
        await sendErrorEmail("Error :", { code: 42 });

        expect(sendAlertEmail).toHaveBeenCalledWith("admin@test.fr", expect.any(String), `Error :\n${JSON.stringify({ code: 42 }, null, 2)}`);
    });

    it('Writes an error with its stack, instead of the empty object JSON would give', async () => {
        const error = new Error("Email sending failed");

        await sendErrorEmail("Failed to send the verification email :", error);

        expect(sendAlertEmail).toHaveBeenCalledWith("admin@test.fr", expect.any(String), `Failed to send the verification email :\n${error.stack}`);
    });

    it('Writes an error without stack with its name and its message', async () => {
        const errorWithoutStack = new TypeError("Cannot read properties of undefined");
        errorWithoutStack.stack = undefined;

        await sendErrorEmail(errorWithoutStack);

        expect(sendAlertEmail).toHaveBeenCalledWith("admin@test.fr", expect.any(String), "TypeError: Cannot read properties of undefined");
    });

    it('Writes as plain text the values which JSON can not write', async () => {
        const circularValue: Record<string, unknown> = { name: "circular" };
        circularValue.itself = circularValue;

        await sendErrorEmail(undefined, circularValue);

        expect(sendAlertEmail).toHaveBeenCalledWith("admin@test.fr", expect.any(String), "undefined\n[object Object]");
    });

    it('Does not send the errors which follow during the cooldown', async () => {
        await sendErrorEmail("First error");

        vi.advanceTimersByTime(OneMinute);
        await expect(sendErrorEmail("Second error")).resolves.toBe(false);
        await expect(sendErrorEmail("Third error")).resolves.toBe(false);

        expect(sendAlertEmail).toHaveBeenCalledTimes(1);
    });

    it('Sends an email again after the cooldown, with the number of errors which were not sent', async () => {
        await sendErrorEmail("First error");
        await sendErrorEmail("Second error");
        await sendErrorEmail("Third error");

        vi.advanceTimersByTime(16 * OneMinute);
        await expect(sendErrorEmail("Fourth error")).resolves.toBe(true);

        expect(sendAlertEmail).toHaveBeenCalledTimes(2);
        expect(sendAlertEmail).toHaveBeenLastCalledWith("admin@test.fr", expect.any(String), expect.stringMatching(/^2 autre\(s\) erreur\(s\)[\s\S]*Fourth error$/));
    });

    it('Does not call a failing mail server again for each error', async () => {
        sendAlertEmail.mockRejectedValue(new Error("Email sending failed"));

        await expect(sendErrorEmail("First error")).rejects.toThrow("Email sending failed");
        await expect(sendErrorEmail("Second error")).resolves.toBe(false);

        expect(sendAlertEmail).toHaveBeenCalledTimes(1);
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneMinute: number = 60 * 1000;
