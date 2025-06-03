import { Request, Response, NextFunction } from 'express';
import * as Users from '../models/usersDao';
import { generateToken } from '../utils/utils';
import * as logger from '../utils/logger';
import config from '../config/config';
import { sendEmailConnexion } from '../mail/connexionMail';



/**
 * Sends a token to the email address provided in the request body.
 * @param req Request
 * @param req.body.email Email address to send the token to
 * @param req.body.app_name Optional application name for the email subject
 * @param res Return success message or error
 * @param next NextFunction
 */
export const sendToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify body request */
        const email = req.body.email instanceof Array ? req.body.email[req.body.email.length-1] : req.body.email;
        const appName = req.body.app_name || config.app_name;
        if (!email || typeof email !== 'string') {
            res.status(400).json({ error: 'Invalid email address.' });
            return;
        }

        /* Verify user informations */
        try {
            Users.getUserByEmail(email).then((user) => {
                /* Generate token */
                const token = generateToken(128) + "." + (Date.now() + 3600000) + "." + user.users_id; // Token valid for 1 hour
                logger.debug("token :", token)

                /* Save token */
                try {
                    Users.updateUserById(user.users_id, {users_token: token}).then((result) => {
                        user.users_token = result.users_token;
                    }).catch((err) => {
                        logger.error("Failed to update token :", err);
                        res.status(500).json({ error: 'Failed to update token.' });
                        return;
                    });
                } catch (error) {
                    logger.error(error);
                    res.status(500).json({ error: 'Internal server error.' });
                    return;
                }

                /* Send token by email */
                sendEmailConnexion(email, appName, token).then(() => {
                    logger.debug("Email sent successfully to :", email);
                    /* Return success message */
                    res.status(200).json({ message: 'Token sent successfully' });
                }).catch((err) => {
                    logger.error("Failed to send email :", err);
                    res.status(500).json({ error: 'Failed to send email.' });
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


/**
 * Registers a new user with the provided information.
 * @param req Request
 * @param req.body.email Email address of the user
 * @param req.body.name Optional name of the user
 * @param res Return JWT for authentication or error
 * @param next NextFunction
 */
export const registerUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Save and get user informations */

        /* Generate JWT */

        /* Return JWT */
        res.json({ message: 'User registration not implemented yet.' });
    } catch (error) {
        next(error);
    }
};


/**
 * Generates a JWT for the user based on the provided information.
 * @param req Request
 * @param req.query.email Email address of the user
 * @param req.query.token Token for verification
 * @param res Return JWT or error
 * @param next NextFunction
 */
export const getJwt = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify body request */

        /* Get user informations */
        
        /* Verify user informations */

        /* Generate JWT */

        /* Return JWT */
        res.json({ message: 'JWT generation not implemented yet.' });
    } catch (error) {
        next(error);
    }
}


/**
 * Verifies the user's email and generates a JWT.
 * @param req Request
 * @param req.body.email Email address of the user
 * @param req.body.token Token for verification
 * @param res Return JWT or error
 * @param next NextFunction
 */
export const verifiedEmail = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Get user email */
    } catch (error) {
        next(error);
    }
}