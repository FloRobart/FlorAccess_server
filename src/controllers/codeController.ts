import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import { isValidEmail, isValidRequestBody } from '../utils/utils';
import * as logger from '../utils/logger';
import config from '../config/config';
import { sendCodeEmail } from '../mail/codeEmail';
import { getJwt, hashString, verifyHash, generateCode } from '../utils/securities';
import { User } from '../models/UsersModel';
import { AppError } from '../models/ErrorModel';



/**
 * Handles user login requests by sending a code to the provided email address.
 * @POST /code/login/request
 * @param req Request
 * @param req.body.email Email address to send the token to
 * @param req.body.app_name Optional application name for the email subject
 * @param res Return success message or error
 * @param next NextFunction
 * @returns Success message if the email is sent, or error response
 */
export const loginRequest = async (req: Request, res: Response, next: NextFunction) => {
    /* Verify body request */
    if (!isValidRequestBody(req.body, ['email'])) {
        next(new AppError("Invalid request body.", 400));
        return;
    }
    const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length - 1] : req.body.email;
    const name = Array.isArray(req.body.name) ? req.body.name[req.body.name.length - 1] : req.body.name;
    const appName = req.body.app_name || config.app_name;

    if (!isValidEmail(email) || !name) {
        next(new AppError("Invalid email address or name.", 400));
        return;
    }

    /* Verify user informations */
    try {
        const user: User = {
            users_email: email,
            users_name: name,
            users_authmethod: 'code',
            users_ip: req.ip,
            users_connected: false,
        } as unknown as User;
        const code = await generateCode(6);

        user.users_secret = await hashString(code);
        Users.updateUser(user).then(() => {
            /* Send code by email */
            sendCodeEmail(email, appName, code)
                .then(() => {
                    res.status(200).json({ message: 'Code sent successfully' });
                })
                .catch((err: Error) => {
                    logger.error("Failed to send email:", err);
                    next(new AppError("Failed to send email.", 500));
                    return;
                });
        })
        .catch((err: Error) => {
            logger.error("Failed to update user :", err);
            next(new AppError("Failed to update user.", 500));
            return;
        });
    } catch (err) {
        logger.error(err);
        next(new AppError());
        return;
    }
};

/**
 * Handles user login confirmation by verifying the provided code.
 * @POST /code/login/confirm
 * @param req Request
 * @param req.body.email Email address of the user
 * @param req.body.code Verification code sent to the user email
 * @param res Return JWT token or error
 * @param next NextFunction
 * @returns JWT token if successful, or error response
 */
export const loginConfirmation = async (req: Request, res: Response, next: NextFunction) => {
    /* Verify body request */
    if (!isValidRequestBody(req.body, ['email', 'code'])) {
        next(new AppError("Invalid request body", 400));
        return;
    }
    const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
    const code = (Array.isArray(req.body.code) ? req.body.code[req.body.code.length-1] : req.body.code).toString().trim().toUpperCase();

    if (!isValidEmail(email)) {
        next(new AppError("Invalid email address", 400));
        return;
    }

    /* Verify user informations */
    try {
        const user = await Users.getUserByEmail(email);

        if (!user || !user.users_secret) {
            next(new AppError("User not found", 400));
            return;
        }

        /* Verify code */
        if (await verifyHash(code, user.users_secret)) {
            user.users_secret = null; // Clear the secret after successful login
            user.users_connected = true; // Set user as connected
            user.users_authmethod = 'code'; // Ensure auth method is set to code
            Users.updateUser(user).then(async () => {
                res.status(200).json({ jwt: await getJwt(user) });
            }).catch((err: Error) => {
                logger.error("Failed to update user :", err);
                next(new AppError());
                return;
            });
        } else {
            next(new AppError("Invalid code", 401));
            return;
        }
    } catch (err) {
        logger.error(err);
        next(new AppError());
    }
};
