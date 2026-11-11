import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import sendEmail, { ADMIN_EMAIL_LIMIT_REACHED_MESSAGE, assertAdminEmailsCanBeSent, assertEmailCanBeSent, sendAlertEmail, EMAIL_LIMIT_REACHED_MESSAGE } from "../../../src/core/email/mailer";
import logger from "../../../src/core/utils/logger";
import { AppError } from "../../../src/core/models/AppError.model";



const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/* The configuration is shared with the tests, so that each test can choose its environment */
const { mockedAppConfig, sendMail, transporterOptions } = vi.hoisted(() => ({
    mockedAppConfig: {
        app_name: "Floraccess",
        app_env: "prod",
        mail_service: "gmail",
        mail_username: "sender@test.fr",
        mail_password: "mail-password",
        email_daily_limit: 3,
        email_reserved_for_users: 1,
    },
    sendMail: vi.fn(),
    transporterOptions: [] as unknown[],
}));

vi.mock("../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));

/* No email is really sent : the transporter created at the import of the mailer is replaced */
vi.mock("nodemailer", () => ({
    default: {
        createTransport: vi.fn((options: unknown) => {
            transporterOptions.push(options);
            return { sendMail: sendMail };
        }),
    },
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
 * Mailer tests
 */
describe('Mailer', () => {
    /* Only the date is faked: the daily limit counts the emails of the last 24 hours */
    vi.useFakeTimers({ toFake: ['Date'] });

    beforeEach(() => {
        mockedAppConfig.app_env = "prod";
        sendMail.mockResolvedValue({ response: "250 OK" });

        /* Each test starts one day after the previous one, so that the emails of the other tests do not count anymore */
        vi.setSystemTime(Date.now() + MILLISECONDS_PER_DAY);
    });

    afterAll(() => {
        vi.useRealTimers();
    });


    it('Connects to the mail service with the account of the configuration', () => {
        expect(transporterOptions).toStrictEqual([{
            service: "gmail",
            auth: {
                user: "sender@test.fr",
                pass: "mail-password",
            },
        }]);
    });

    it('Sends the email from the application to the recipient', async () => {
        await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");

        expect(sendMail).toHaveBeenCalledWith({
            from: "Floraccess <sender@test.fr>",
            to: "recipient@test.fr",
            subject: "Subject",
            html: "<p>Content</p>",
        });
    });

    it('Builds the options of each email apart, so that emails sent at the same time never mix their recipients', async () => {
        await Promise.all([
            sendEmail("first@test.fr", "First subject", "<p>First</p>"),
            sendEmail("second@test.fr", "Second subject", "<p>Second</p>"),
        ]);

        expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "first@test.fr", subject: "First subject", html: "<p>First</p>" }));
        expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "second@test.fr", subject: "Second subject", html: "<p>Second</p>" }));
    });

    it('Logs the answer of the mail server only in the development environment', async () => {
        await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");
        expect(logger.info).not.toHaveBeenCalled();

        mockedAppConfig.app_env = "dev";
        await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");
        expect(logger.info).toHaveBeenCalledWith(expect.any(String), "250 OK");
    });

    it('Throws an application error when the mail server fails', async () => {
        sendMail.mockRejectedValue(new Error("SMTP connection refused"));

        const sending = sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");

        await expect(sending).rejects.toBeInstanceOf(AppError);
        await expect(sending).rejects.toMatchObject({ message: "Email sending failed", httpStatus: 500 });
    });


    /*===================*/
    /* Daily email limit */
    /*===================*/
    describe('Daily limit of emails', () => {
        it('Refuses the emails beyond the daily limit with a 503 error, without calling the mail server', async () => {
            for (let emailNumber = 0; emailNumber < mockedAppConfig.email_daily_limit; emailNumber++) {
                await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");
            }

            const sending = sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");

            await expect(sending).rejects.toMatchObject({ message: EMAIL_LIMIT_REACHED_MESSAGE, httpStatus: 503 });
            expect(sendMail).toHaveBeenCalledTimes(mockedAppConfig.email_daily_limit);
        });

        it('Counts the emails which the mail server refused, so that a failing server is not called again and again', async () => {
            sendMail.mockRejectedValue(new Error("SMTP connection refused"));

            for (let emailNumber = 0; emailNumber < mockedAppConfig.email_daily_limit; emailNumber++) {
                await expect(sendEmail("recipient@test.fr", "Subject", "<p>Content</p>")).rejects.toMatchObject({ httpStatus: 500 });
            }

            expect(() => assertEmailCanBeSent()).toThrow(EMAIL_LIMIT_REACHED_MESSAGE);
        });

        it('Accepts emails again once the oldest ones are more than one day old', async () => {
            for (let emailNumber = 0; emailNumber < mockedAppConfig.email_daily_limit; emailNumber++) {
                await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");
            }

            vi.setSystemTime(Date.now() + MILLISECONDS_PER_DAY + 1);

            await expect(sendEmail("recipient@test.fr", "Subject", "<p>Content</p>")).resolves.toBeUndefined();
        });

        it('Checks the limit before an email without counting it', async () => {
            for (let checkNumber = 0; checkNumber < mockedAppConfig.email_daily_limit + 1; checkNumber++) {
                expect(() => assertEmailCanBeSent()).not.toThrow();
            }

            for (let emailNumber = 0; emailNumber < mockedAppConfig.email_daily_limit; emailNumber++) {
                await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");
            }

            expect(() => assertEmailCanBeSent()).toThrow(AppError);
            expect(() => assertEmailCanBeSent()).toThrow(EMAIL_LIMIT_REACHED_MESSAGE);
        });
    });


    /*======================*/
    /* Administrator emails */
    /*======================*/
    describe('Sendings of the administrators', () => {
        it('Accepts a whole sending only if it leaves the emails reserved for the users', () => {
            expect(() => assertAdminEmailsCanBeSent(2)).not.toThrow();

            expect(() => assertAdminEmailsCanBeSent(3)).toThrow(AppError);
            expect(() => assertAdminEmailsCanBeSent(3)).toThrow(ADMIN_EMAIL_LIMIT_REACHED_MESSAGE);
        });

        it('Takes into account the emails already sent to the users', async () => {
            await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");

            expect(() => assertAdminEmailsCanBeSent(1)).not.toThrow();
            expect(() => assertAdminEmailsCanBeSent(2)).toThrow(ADMIN_EMAIL_LIMIT_REACHED_MESSAGE);
        });

        it('Refuses every sending once only the reserve of the users is left, without counting the checks', async () => {
            await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");
            await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");

            for (let checkNumber = 0; checkNumber < 3; checkNumber++) {
                expect(() => assertAdminEmailsCanBeSent(1)).toThrow(ADMIN_EMAIL_LIMIT_REACHED_MESSAGE);
            }
            expect(() => assertEmailCanBeSent()).not.toThrow();
        });
    });


    /*==============*/
    /* Alert emails */
    /*==============*/
    describe('Alert emails of the administrator', () => {
        it('Sends the alerts even when the daily limit is reached, and does not count them', async () => {
            for (let alertNumber = 0; alertNumber < mockedAppConfig.email_daily_limit + 1; alertNumber++) {
                await sendAlertEmail("admin@test.fr", "Error", "<p>Error</p>");
            }
            expect(() => assertEmailCanBeSent()).not.toThrow();

            for (let emailNumber = 0; emailNumber < mockedAppConfig.email_daily_limit; emailNumber++) {
                await sendEmail("recipient@test.fr", "Subject", "<p>Content</p>");
            }

            await expect(sendAlertEmail("admin@test.fr", "Error", "<p>Error</p>")).resolves.toBeUndefined();
            expect(sendMail).toHaveBeenLastCalledWith(expect.objectContaining({ to: "admin@test.fr" }));
        });

        it('Throws an application error when the mail server fails to send an alert', async () => {
            sendMail.mockRejectedValue(new Error("SMTP connection refused"));

            await expect(sendAlertEmail("admin@test.fr", "Error", "<p>Error</p>")).rejects.toMatchObject({ message: "Email sending failed", httpStatus: 500 });
        });
    });
});
