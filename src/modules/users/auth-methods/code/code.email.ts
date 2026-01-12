import AppConfig from "../../../../config/AppConfig";
import sendEmail from "../../../../core/email/mailer";
import { getEmailTemplate } from '../../../../core/email/get_email_template';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 */
export async function sendEmailCode(to: string, app_name: string, code: string): Promise<void> {
    try {
        const appName = app_name || AppConfig.app_name;
        const stringCode: string = code.toString().replace(/(\d{2})(?=\d)/g, '$1 ');

        const html = await getEmailTemplate('email_code_template', {
            appName: appName,
            code: stringCode,
            currentYear: String(new Date().getFullYear())
        });

        await sendEmail(to, `Votre code pour ${appName} : ${stringCode}`, html);
    } catch (error) {
        throw error;
    }
}