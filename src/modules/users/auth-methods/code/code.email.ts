import config from "../../../../config/config";
import sendEmail from "../../../../core/email/mailer";
import { htmlCodeEmailTemplate } from "../../../../core/email/mailTemplate";



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 */
export async function sendEmailCode(to: string, app_name: string, code: string): Promise<void> {
    try {
        const appName = app_name || config.app_name;

        const html = htmlCodeEmailTemplate(appName, code);

        await sendEmail(to, `Votre code pour ${appName} : ${code.toString().replace(/(\d{2})(?=\d)/g, '$1 ')}`, html);
    } catch (error) {
        throw error;
    }
}