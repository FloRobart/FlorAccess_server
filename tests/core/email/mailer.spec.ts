import { describe, it, expect, vi, beforeEach } from "vitest";
import sendEmail from "../../../src/core/email/mailer";
import logger from "../../../src/core/utils/logger";
import { AppError } from "../../../src/core/models/AppError.model";



/* The configuration is shared with the tests, so that each test can choose its environment */
const { mockedAppConfig, sendMail, transporterOptions } = vi.hoisted(() => ({
    mockedAppConfig: {
        app_name: "Floraccess",
        app_env: "prod",
        mail_service: "gmail",
        mail_username: "sender@test.fr",
        mail_password: "mail-password",
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
    beforeEach(() => {
        mockedAppConfig.app_env = "prod";
        sendMail.mockResolvedValue({ response: "250 OK" });
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
});
