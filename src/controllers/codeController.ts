import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import { isValidEmail, isValidRequestBody } from '../utils/utils';
import * as logger from '../utils/logger';
import config from '../config/config';
import { sendCodeEmail } from '../mail/codeEmail';
import { getJwt, hashString, verifyHash, generateCode } from '../utils/securities';
import { User } from '../models/UsersModel';



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
    logger.debug("loginRequest body :", req.body);
    if (!isValidRequestBody(req.body, ['email'])) {
        res.status(400).json({ error: 'Invalid request body.' });
        return;
    }
    const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
    const name = Array.isArray(req.body.name) ? req.body.name[req.body.name.length-1] : req.body.name;
    const appName = req.body.app_name || config.app_name;

    if (!isValidEmail(email) || !name) {
        res.status(400).json({ error: 'Invalid email address or name.' });
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
                        next("Failed to send email.");
                        return;
                    });
            })
            .catch((err: Error) => {
                next("Failed to update user.");
                return;
            });
    } catch (error) {
        next("Internal server error.");
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
        res.status(400).json({ error: 'Invalid request body.' });
        return;
    }
    const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
    const code = (Array.isArray(req.body.code) ? req.body.code[req.body.code.length-1] : req.body.code).toString().trim().toUpperCase();

    if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email address.' });
        return;
    }

    /* Verify user informations */
    try {
        const user = await Users.getUserByEmail(email);

        if (!user || !user.users_secret) {
            res.status(400).json({ error: 'User not found.' });
            return;
        }

        /* Verify code */
        if (await verifyHash(code, user.users_secret))  {
            user.users_secret = null; // Clear the secret after successful login
            user.users_connected = true; // Set user as connected
            user.users_authmethod = 'code'; // Ensure auth method is set to code
            Users.updateUser(user).then(async () => {
                logger.debug("User authenticated successfully:", user);
                res.status(200).json({ jwt: await getJwt(user) });
            }).catch((err: Error) => {
                logger.error("Failed to update user:", err);
                res.status(500).json({ error: 'Internal server error.' });
                next(err);
                return;
            });
        } else {
            res.status(401).json({ error: 'Invalid code.' });
            return;
        }

    } catch (error) {
        logger.error(error);
        next("Internal server error.");
    }
};
