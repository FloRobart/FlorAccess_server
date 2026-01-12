import path from 'path';
import escapeHtml from '../utils/parse_html';
import fs from 'fs/promises';



/**
 * Retrieves and populates an email template with the provided variables.
 * @param templateName Name of the email template to retrieve (file name without file extension).
 * @param variables Key-value pairs to replace placeholders in the template.
 * @return Populated HTML content of the email template.
 */
export async function getEmailTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
    const templatePath = path.join(process.cwd(), 'public', 'html', `${templateName}.html`);
    const raw = await fs.readFile(templatePath, 'utf8');
    let html = raw;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, escapeHtml(value));
    }

    return html;
}
