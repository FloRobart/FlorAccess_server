import path from "path";
import AppConfig from "../../config/AppConfig";
import sendEmail from "../../core/email/mailer";
import fs from "fs/promises";
import escapeHtml from "../../core/utils/parse_html";



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 */
export async function sendEmailVerify(to: string, app_name: string, url: string): Promise<void> {
    try {
        const appName = app_name || AppConfig.app_name;
        const courrentYear: string = String(new Date().getFullYear());

        const templatePath = path.join(process.cwd(), 'public', 'html', 'email_verification_email.html');
        const raw = await fs.readFile(templatePath, 'utf8');
        const html = raw
            .replace(/{{\s*appName\s*}}/g, escapeHtml(appName))
            .replace(/{{\s*url\s*}}/g, escapeHtml(url))
            .replace(/{{\s*currentYear\s*}}/g, escapeHtml(courrentYear));

        await sendEmail(to, `${appName} : Verification de votre email`, html);
    } catch (error) {
        throw error;
    }
}