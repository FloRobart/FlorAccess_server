import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import AppConfig from '../../config/AppConfig';
import { AppError } from '../models/AppError.model';
import { SlidingWindowCounter } from '../utils/sliding_window_counter';



const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const EMAIL_LIMIT_REACHED_MESSAGE = "Emails are temporarily unavailable, please try again later";
export const ADMIN_EMAIL_LIMIT_REACHED_MESSAGE = "Not enough emails left for this sending: the remaining emails of the day are kept for the login codes of the users";



const transporter = nodemailer.createTransport({
    service: AppConfig.mail_service,
    auth: {
        user: AppConfig.mail_username,
        pass: AppConfig.mail_password
    }
});

/**
 * Emails sent to the users over the last 24 hours (login codes, verification links, messages of the administrators).
 * Anyone can make the API send an email, so without this limit the mail account could exceed its sending quota:
 * the mail service would then refuse every email, and nobody could receive a login code anymore.
 */
const sentEmailsCounter = new SlidingWindowCounter(AppConfig.email_daily_limit, MILLISECONDS_PER_DAY);



/**
 * Checks that the daily limit of emails still allows one more email, without counting it.
 * Called before the changes which lead to an email (account creation, login code), so that nothing is changed for an email which can not be sent.
 * @throws AppError 503 if the daily limit of emails is reached
 */
export function assertEmailCanBeSent(): void {
    if (!sentEmailsCounter.hasCapacity()) {
        throw new AppError(EMAIL_LIMIT_REACHED_MESSAGE, 503);
    }
}


/**
 * Checks that the daily limit of emails still allows a whole sending of the administrators.
 *
 * The sending must leave the emails reserved for the users: a message sent to every user must not use up
 * the emails which the login codes of the day need. The whole sending is checked before its first email,
 * so that it reaches either every recipient or none of them.
 * @param emailCount Number of emails of the sending
 * @throws AppError 503 if the sending does not fit in the emails left once the reserve of the users is kept
 */
export function assertAdminEmailsCanBeSent(emailCount: number): void {
    const emailsLeftForAdministrators: number = sentEmailsCounter.getRemainingCapacity() - AppConfig.email_reserved_for_users;

    if (emailCount > emailsLeftForAdministrators) {
        throw new AppError(ADMIN_EMAIL_LIMIT_REACHED_MESSAGE, 503);
    }
}


/**
 * Sends an email to a user, within the daily limit of emails.
 * @param to Email address of the recipient
 * @param subject Subject of the email
 * @param html HTML content of the email
 * @throws AppError 503 if the daily limit of emails is reached, 500 if the mail server fails
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!sentEmailsCounter.tryRecordEvent()) {
        throw new AppError(EMAIL_LIMIT_REACHED_MESSAGE, 503);
    }

    await deliverEmail(to, subject, html);
}


/**
 * Sends an alert email to the administrator, outside of the daily limit of emails.
 * The alerts are already limited by their own cooldown, and must still warn the administrator when the limit is reached.
 * @param to Email address of the administrator
 * @param subject Subject of the email
 * @param html HTML content of the email
 * @throws AppError 500 if the mail server fails
 */
export async function sendAlertEmail(to: string, subject: string, html: string): Promise<void> {
    await deliverEmail(to, subject, html);
}


/**
 * Gives an email to the mail server.
 * The options are built for each email: emails sent at the same time can never mix their recipients.
 * @param to Email address of the recipient
 * @param subject Subject of the email
 * @param html HTML content of the email
 * @throws AppError 500 if the mail server fails
 */
async function deliverEmail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
        from: AppConfig.app_name + " <" + AppConfig.mail_username + ">",
        to: to,
        subject: subject,
        html: html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        if (AppConfig.app_env.includes('dev')) {
            logger.info('Email sent :', info.response);
        }
    } catch (error) {
        throw new AppError("Email sending failed", 500);
    }
}



export default sendEmail;
