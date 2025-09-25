import config from '../config/config';
import sendEmail from './mailer';
import { htmlErrorEmailTemplate } from './mailTemplate';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 * @returns {Promise<boolean>} A promise that resolves when the email is sent
 */ 
export async function sendErrorEmail(...args: any[]): Promise<boolean> {
    const html = htmlErrorEmailTemplate(config.app_name, ...args);

    return sendEmail(config.mail_username, `Erreur dans ${config.app_name}`, html).then((result) => {
        return result;
    }).catch((err: Error) => {
        throw err;
    });
}