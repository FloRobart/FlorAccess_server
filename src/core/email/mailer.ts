import nodemailer from 'nodemailer';
import * as logger from '../utils/logger';
import config from '../../config/config';
import { AppError } from '../models/AppError.model';



const transporter = nodemailer.createTransport({
    service: config.mail_service,
    auth: {
        user: config.mail_username,
        pass: config.mail_password
    }
});

const mailOptions = {
    from: config.app_name + " <" + config.mail_username + ">",
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
        if (config.app_env.includes('dev')) {
            logger.info('Email sent :', info.response);
        }
    } catch (error) {
        throw new AppError("Email sending failed", 500);
    }
}



export default sendEmail;