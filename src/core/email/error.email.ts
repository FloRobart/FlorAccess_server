import AppConfig from '../../config/AppConfig';
import { sendAlertEmail } from './mailer';
import { getEmailTemplate } from '../email/get_email_template';



/* State of the cooldown between two error emails */
let lastErrorEmailSentAt: number = 0;
let skippedErrorCount: number = 0;



/**
 * Sends an email to the administrator when an error happens.
 *
 * At most one email is sent per cooldown : errors which can be triggered from the outside would otherwise
 * use up the sending quota of the mail account, and the login codes of every user could not be sent anymore.
 * The errors skipped during the cooldown stay in the server logs, and their number is written in the next email.
 * @param args Content of the error, as given to the logger
 * @returns True if the email was sent, false if it was skipped because of the cooldown
 */
export async function sendErrorEmail(...args: any[]): Promise<boolean> {
    const isInCooldown = Date.now() - lastErrorEmailSentAt < AppConfig.error_email_cooldown;
    if (isInCooldown) {
        skippedErrorCount++;
        return false;
    }

    /* The cooldown starts before the sending : a mail server which fails must not be called again for each error */
    const skippedErrorCountSinceLastEmail = skippedErrorCount;
    lastErrorEmailSentAt = Date.now();
    skippedErrorCount = 0;

    const errorMessage = args.map(formatErrorEmailValue).join('\n');
    const skippedErrorsNotice = skippedErrorCountSinceLastEmail > 0 ? `${skippedErrorCountSinceLastEmail} autre(s) erreur(s) n'ont pas été envoyées par email depuis le dernier envoi, consultez les logs du serveur.\n\n` : '';
    const courrentYear: string = String(new Date().getFullYear());

    const html = await getEmailTemplate('email_error_template', {
        appName: AppConfig.app_name,
        errorMessage: skippedErrorsNotice + errorMessage,
        currentYear: courrentYear
    });

    try {
        await sendAlertEmail(AppConfig.mail_username, `Erreur dans ${AppConfig.app_name}`, html);
        return true;
    } catch (error) {
        throw error;
    }
}


/**
 * Writes one of the values given to the logger as text for the error email.
 *
 * An error is written with its stack: its message and its stack are not enumerable, so JSON would only give "{}".
 * A value which JSON can not write (circular object, undefined) is written as a plain text.
 * @param value Value given to the logger
 * @returns Text of the value
 */
function formatErrorEmailValue(value: unknown): string {
    if (typeof value === 'string') { return value; }
    if (value instanceof Error) { return value.stack || `${value.name}: ${value.message}`; }

    try {
        return JSON.stringify(value, null, 2) ?? String(value);
    } catch (error) {
        return String(value);
    }
}
