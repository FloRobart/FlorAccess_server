import AppConfig from '../../config/AppConfig';
import sendEmail from './mailer';
import { getEmailTemplate } from '../email/get_email_template';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param token Authentication token to be included in the verification link
 */
export async function sendErrorEmail(...args: any[]): Promise<void> {
    const errorMessage = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join('\n');
    const courrentYear: string = String(new Date().getFullYear());

    const html = await getEmailTemplate('email_error_template', {
        appName: AppConfig.app_name,
        errorMessage: errorMessage,
        currentYear: courrentYear
    });

    try {
        await sendEmail(AppConfig.mail_username, `Erreur dans ${AppConfig.app_name}`, html);
    } catch (error) {
        throw error;
    }
}