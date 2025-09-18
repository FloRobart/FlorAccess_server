import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import { generateUserToken, isValidEmail, isValidRequestBody } from '../utils/utils';
import * as logger from '../utils/logger';
import config from '../config/config';
import { sendTokenEmail } from '../mail/tokenMail';
import { AppError } from '../models/ErrorModel';



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
            next(new AppError("Invalid request body", 400));
            return;
        }
        const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
        const appName = req.body.app_name || config.app_name;

        if (!isValidEmail(email)) {
            next(new AppError("Invalid email address", 400));
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
                        next(new AppError("Failed to update token", 500));
                        return;
                    });
                } catch (err) {
                    logger.error("Failed to update token 2 :", err);
                    next(new AppError("Failed to update token", 500));
                    return;
                }

                /* Send token by email */
                sendTokenEmail(email, appName, token).then(() => { // add route to the email
                    res.status(200).json({ message: 'Token sent successfully' });
                }).catch((err) => {
                    logger.error("Failed to send email :", err);
                    next(new AppError("Failed to send email", 500));
                    return;
                });
            }).catch((err) => {
                logger.error(err);
                next(new AppError("User not found", 400));
                return;
            });
        } catch (err) {
            logger.error(err);
            next(new AppError());
        }
    } catch (err) {
        logger.error(err);
        next(new AppError());
    }
};
