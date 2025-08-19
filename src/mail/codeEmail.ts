import config from '../config/config';
import sendEmail from './mailer';
import { htmlCodeEmailTemplate } from './mailTemplate';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 * @returns {Promise<void>} A promise that resolves when the email is sent
 */ 
export async function sendCodeEmail(to: string, app_name: string, code: string): Promise<void> {
    const appName = app_name || config.app_name;

    const html = htmlCodeEmailTemplate(appName, code);

    sendEmail(to, `Connexion avec ${appName}`, html);
}