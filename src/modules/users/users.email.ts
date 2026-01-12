import AppConfig from "../../config/AppConfig";
import sendEmail from "../../core/email/mailer";
import { getEmailTemplate } from '../../core/email/get_email_template';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param url Verification URL to be included in the email body
 */
export async function sendEmailVerify(to: string, app_name: string, url: string): Promise<void> {
    try {
        const appName = app_name || AppConfig.app_name;
        const html = await getEmailTemplate('email_verification_email', {
            appName: appName,
            url: url,
            currentYear: String(new Date().getFullYear())
        });

        await sendEmail(to, `${appName} : Verification de votre email`, html);
    } catch (error) {
        throw error;
    }
}