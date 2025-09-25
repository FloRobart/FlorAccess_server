import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import { generateUserToken, isValidEmail, isValidRequestBody } from '../utils/utils';
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
            next(new AppError({message: "Invalid request body", httpStatus: 400}));
            return;
        }
        const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
        const appName = req.body.app_name || config.app_name;

        if (!isValidEmail(email)) {
            next(new AppError({message: "Invalid email address", httpStatus: 400}));
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
                    }).catch((err: Error) => {
                        next(new AppError({message: "Failed to update token", httpStatus: 500, stackTrace: err}));
                        return;
                    });
                } catch (err) {
                    next(new AppError({message: "Failed to update token", httpStatus: 500, stackTrace: err}));
                    return;
                }

                /* Send token by email */
                sendTokenEmail(email, appName, token).then(() => { // add route to the email
                    res.status(200).json({ message: 'Token sent successfully' });
                }).catch((err: Error) => {
                    next(new AppError({message: "Failed to send email", httpStatus: 500, stackTrace: err}));
                    return;
                });
            }).catch((err: Error) => {
                next(new AppError({message: "User not found", httpStatus: 400, stackTrace: err}));
                return;
            });
        } catch (err) {
            next(new AppError({stackTrace: err}));
        }
    } catch (err) {
        next(new AppError({stackTrace: err}));
    }
};
