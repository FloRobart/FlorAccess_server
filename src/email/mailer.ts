import nodemailer from 'nodemailer';
import * as logger from '../utils/logger';
import config from '../config/config';
import { ENABLE_ENV } from '../config/enableenv';



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
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    mailOptions.to = to;
    mailOptions.subject = subject;
    mailOptions.html = html;

    return transporter.sendMail(mailOptions).then((info) => {
        if (ENABLE_ENV[config.app_env] === 5) {
            logger.info('Email sent: ' + info.response);
        }
        return true;
    }).catch((err: Error) => {
        throw err;
    });
}


export default sendEmail;
