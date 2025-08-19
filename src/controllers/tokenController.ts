import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import { generateUserToken, isValidEmail, isValidRequestBody } from '../utils/utils';
import * as logger from '../utils/logger';
import config from '../config/config';
import { sendTokenEmail } from '../mail/tokenMail';
import JWT from 'jsonwebtoken';



/**
 * Sends a token to the email address provided in the request body.
 * @POST /send/token
 * @param req Request
 * @param req.body.email Email address to send the token to
 * @param req.body.app_name Optional application name for the email subject
 * @param res Return success message or error
 * @param next NextFunction
 */
export const sendToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify body request */
        if (!isValidRequestBody(req.body, ['email'])) { // add verif for callback route
            res.status(400).json({ error: 'Invalid request body.' });
            return;
        }
        const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
        const appName = req.body.app_name || config.app_name;

        if (!isValidEmail(email)) {
            res.status(400).json({ error: 'Invalid email address.' });
            return;
        }

        /* Verify user informations */
        try {
            Users.getUserByEmail(email).then((user) => {
                /* Generate token */
                const token = generateUserToken(user.users_id);

                /* Save token */
                try {
                    Users.updateUser(user).then((result) => {
                        user.users_secret = result.users_secret;
                    }).catch((err) => {
                        logger.error("Failed to update token :", err);
                        next("Failed to update token.");
                        return;
                    });
                } catch (error) {
                    logger.error(error);
                    next("Internal server error.");
                    return;
                }

                /* Send token by email */
                sendTokenEmail(email, appName, token).then(() => { // add route to the email
                    res.status(200).json({ message: 'Token sent successfully' });
                }).catch((err) => {
                    logger.error("Failed to send email :", err);
                    next("Failed to send email.");
                    return;
                });
            }).catch((err) => {
                logger.error(err);
                res.status(400).json({ error: 'User not found !' });
                return;
            });
        } catch (error) {
            logger.error(error);
            next("Internal server error.");
        }
    } catch (error) {
        next();
    }
};
