import config from '../../config/config';
import sendEmail from '../../core/email/mailer';
import { htmlCodeEmailTemplate } from '../../core/email/mailTemplate';
import * as logger from '../../core/utils/logger';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 * @returns {Promise<boolean>} A promise that resolves when the email is sent
 */
export async function sendCodeEmail(to: string, app_name: string, code: string): Promise<boolean> {
    const appName = app_name || config.app_name;

    logger.debug(`Code : ${code} for ${to}`);
    const html = htmlCodeEmailTemplate(appName, code);

    return sendEmail(to, `Votre code pour ${appName} : ${code}`, html).then((result) => {
        return result;
    }).catch((err: Error) => {
        throw err;
    });
}