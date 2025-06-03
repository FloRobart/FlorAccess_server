import nodemailer from 'nodemailer';
import * as logger from '../utils/logger';
import config from '../config/config';



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
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    mailOptions.to = to;
    mailOptions.subject = subject;
    mailOptions.html = html;

    transporter.sendMail(mailOptions, function(error: any, info: any) {
        if (error) {
            logger.error(error);
        } else {
            logger.success("Email sent successfully");
        }
    });
}


export default sendEmail;