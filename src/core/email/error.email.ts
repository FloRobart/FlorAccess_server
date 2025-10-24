import AppConfig from '../../config/AppConfig';
import sendEmail from './mailer';
import { htmlErrorEmailTemplate } from './mailTemplate';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 */
export async function sendErrorEmail(...args: any[]): Promise<void> {
    const html = htmlErrorEmailTemplate(AppConfig.app_name, ...args);

    try {
        await sendEmail(AppConfig.mail_username, `Erreur dans ${AppConfig.app_name}`, html);
    } catch (error) {
        throw error;
    }
}