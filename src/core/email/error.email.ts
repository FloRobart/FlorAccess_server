import path from 'path';
import AppConfig from '../../config/AppConfig';
import escapeHtml from '../utils/parse_html';
import sendEmail from './mailer';
import fs from 'fs/promises';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param token Authentication token to be included in the verification link
 */
export async function sendErrorEmail(...args: any[]): Promise<void> {
    const errorMessage = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join('\n');
    const courrentYear: string = String(new Date().getFullYear());

    const templatePath = path.join(process.cwd(), 'public', 'html', 'email_error_template.html');
    const raw = await fs.readFile(templatePath, 'utf8');
    const html = raw
        .replace(/{{\s*appName\s*}}/g, escapeHtml(AppConfig.app_name))
        .replace(/{{\s*errorMessage\s*}}/g, escapeHtml(errorMessage))
        .replace(/{{\s*currentYear\s*}}/g, escapeHtml(courrentYear));

    try {
        await sendEmail(AppConfig.mail_username, `Erreur dans ${AppConfig.app_name}`, html);
    } catch (error) {
        throw error;
    }
}