import config from '../config/config';
import sendEmail from './mailer';
import { htmlTokenEmailTemplate } from './mailTemplate';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 * @returns {Promise<void>} A promise that resolves when the email is sent
 */ 
export async function sendTokenEmail(to: string, app_name: string, token: string): Promise<void> {
    const route = `${config.base_url}/jwt?email=${encodeURI(to)}&token=${encodeURI(token)}`;
    const appName = app_name || config.app_name;

    const html = htmlTokenEmailTemplate(appName, route);

    sendEmail(to, `Connexion avec ${appName}`, html);
}