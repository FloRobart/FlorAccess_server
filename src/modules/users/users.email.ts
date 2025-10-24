import AppConfig from "../../config/AppConfig";
import sendEmail from "../../core/email/mailer";
import { htmlEmailVerifyMailTemplate } from "../../core/email/mailTemplate";



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 */
export async function sendEmailVerify(to: string, app_name: string, code: string): Promise<void> {
    try {
        const appName = app_name || AppConfig.app_name;

        const html = htmlEmailVerifyMailTemplate(appName, code);

        await sendEmail(to, `${appName} : Verification de votre email`, html);
    } catch (error) {
        throw error;
    }
}