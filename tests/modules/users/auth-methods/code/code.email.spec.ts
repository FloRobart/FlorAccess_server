import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmailCode } from "../../../../../src/modules/users/auth-methods/code/code.email";
import sendEmail from "../../../../../src/core/email/mailer";
import { getEmailTemplate } from "../../../../../src/core/email/get_email_template";



vi.mock("../../../../../src/config/AppConfig", () => ({
    default: { app_name: "Floraccess" },
}));

/* No email is really sent, and the template is reduced to its name */
vi.mock("../../../../../src/core/email/mailer", () => ({
    default: vi.fn(),
}));

vi.mock("../../../../../src/core/email/get_email_template", () => ({
    getEmailTemplate: vi.fn(),
}));



/**
 * Login code email tests
 */
describe('Login code email', () => {
    beforeEach(() => {
        vi.mocked(getEmailTemplate).mockResolvedValue(EmailHtml);
        vi.mocked(sendEmail).mockResolvedValue();
    });


    it('Sends the code, split in groups of two digits, with the link which blocks the logins', async () => {
        await sendEmailCode("test1@test.fr", "Econoris", "123456", LoginBlockUrl);

        expect(getEmailTemplate).toHaveBeenCalledWith('email_code_template', {
            appName: "Econoris",
            code: "12 34 56",
            loginBlockUrl: LoginBlockUrl,
            currentYear: String(new Date().getFullYear()),
        });
        expect(sendEmail).toHaveBeenCalledWith("test1@test.fr", "Votre code pour Econoris : 12 34 56", EmailHtml);
    });

    it('Uses the name of the API when no application is given', async () => {
        await sendEmailCode("test1@test.fr", "", "ABCDEF", LoginBlockUrl);

        expect(sendEmail).toHaveBeenCalledWith("test1@test.fr", "Votre code pour Floraccess : ABCDEF", EmailHtml);
    });

    it('Gives the failure of the sending to the caller', async () => {
        const sendingError = new Error("Email sending failed");
        vi.mocked(sendEmail).mockRejectedValue(sendingError);

        await expect(sendEmailCode("test1@test.fr", "Econoris", "123456", LoginBlockUrl)).rejects.toBe(sendingError);
    });
});


/*===========*/
/* Test data */
/*===========*/
const EmailHtml: string = "<html>code</html>";
const LoginBlockUrl: string = "http://localhost/users/login/block/1?token=abcdef";
