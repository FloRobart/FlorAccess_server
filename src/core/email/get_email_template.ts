import path from 'path';
import escapeHtml from '../utils/parse_html';
import fs from 'fs/promises';



/**
 * Retrieves and populates an email template with the provided variables.
 *
 * All the placeholders are replaced in a single pass, so that a value which contains
 * a placeholder or a replacement pattern ("$&", "$1"...) is inserted as plain text and never interpreted.
 * @param templateName Name of the email template to retrieve (file name without file extension).
 * @param variables Key-value pairs to replace placeholders in the template. The values are escaped, they can come from a user.
 * @param rawHtmlVariables Key-value pairs inserted as HTML, without escaping. The caller must escape every user value they contain.
 * @return Populated HTML content of the email template.
 */
export async function getEmailTemplate(templateName: string, variables: Record<string, string>, rawHtmlVariables: Record<string, string> = {}): Promise<string> {
    const templatePath = path.join(process.cwd(), 'public', 'html', `${templateName}.html`);
    const template = await fs.readFile(templatePath, 'utf8');

    return template.replace(/{{\s*(\w+)\s*}}/g, (placeholder: string, key: string) => {
        const rawHtmlValue: unknown = rawHtmlVariables[key];
        if (typeof rawHtmlValue === 'string') { return rawHtmlValue; }

        const value: unknown = variables[key];
        if (typeof value === 'string') { return escapeHtml(value); }

        return placeholder;
    });
}
