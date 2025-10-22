import nodemailer from 'nodemailer';
import * as logger from '../utils/logger';
import AppConfig from '../../config/AppConfig';
import { AppError } from '../models/AppError.model';



const transporter = nodemailer.createTransport({
    service: AppConfig.mail_service,
    auth: {
        user: AppConfig.mail_username,
        pass: AppConfig.mail_password
    }
});

const mailOptions = {
    from: AppConfig.app_name + " <" + AppConfig.mail_username + ">",
    to: "",
    subject: "",
    html: ""
};


/**
 * Sends an email using the configured transporter.
 * @param to The recipient's email address
 * @param subject The subject of the email
 * @param html The HTML content of the email
 * @throws {AppError} If email sending fails
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    mailOptions.to = to;
    mailOptions.subject = subject;
    mailOptions.html = html;

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