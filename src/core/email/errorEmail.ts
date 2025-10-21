import config from '../../config/config';
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
    const html = htmlErrorEmailTemplate(config.app_name, ...args);

    try {
        await sendEmail(config.mail_username, `Erreur dans ${config.app_name}`, html);
    } catch (error) {
        throw error;
    }
}