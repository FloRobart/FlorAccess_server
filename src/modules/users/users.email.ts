import AppConfig from "../../config/AppConfig";
import sendEmail from "../../core/email/mailer";
import { getEmailTemplate } from '../../core/email/get_email_template';



/**
 * Sends the email which verifies the email address of a user.
 *
 * The name written in the email is always the one of this API: a name chosen by the client
 * would let anyone send emails with the text of his choice from the address of the API.
 * @param to Email address of the recipient
 * @param url Verification URL to be included in the email body
 */
export async function sendEmailVerify(to: string, url: string): Promise<void> {
    try {
        const appName = AppConfig.app_name;
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
