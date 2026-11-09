import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmailVerify } from "../../../src/modules/users/users.email";
import sendEmail from "../../../src/core/email/mailer";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";



vi.mock("../../../src/config/AppConfig", () => ({
    default: { app_name: "Floraccess" },
}));

/* No email is really sent, and the template is reduced to its name */
vi.mock("../../../src/core/email/mailer", () => ({
    default: vi.fn(),
}));

vi.mock("../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: vi.fn(),
}));



/**
 * Email verification email tests
 */
describe('Email verification email', () => {
    beforeEach(() => {
        vi.mocked(getEmailTemplate).mockResolvedValue(EmailHtml);
        vi.mocked(sendEmail).mockResolvedValue();
    });


    it('Sends the verification link with the name of the application', async () => {
        await sendEmailVerify("test1@test.fr", "Econoris", VerificationUrl);

        expect(getEmailTemplate).toHaveBeenCalledWith('email_verification_email', {
            appName: "Econoris",
            url: VerificationUrl,
            currentYear: String(new Date().getFullYear()),
        });
        expect(sendEmail).toHaveBeenCalledWith("test1@test.fr", "Econoris : Verification de votre email", EmailHtml);
    });

    it('Uses the name of the API when no application is given', async () => {
        await sendEmailVerify("test1@test.fr", "", VerificationUrl);

        expect(sendEmail).toHaveBeenCalledWith("test1@test.fr", "Floraccess : Verification de votre email", EmailHtml);
    });

    it('Gives the failure of the sending to the caller', async () => {
        const sendingError = new Error("Email sending failed");
        vi.mocked(sendEmail).mockRejectedValue(sendingError);

        await expect(sendEmailVerify("test1@test.fr", "Econoris", VerificationUrl)).rejects.toBe(sendingError);
    });
});


/*===========*/
/* Test data */
/*===========*/
const EmailHtml: string = "<html>verification</html>";
const VerificationUrl: string = "http://localhost/users/email/verify/1?token=abcdef";
