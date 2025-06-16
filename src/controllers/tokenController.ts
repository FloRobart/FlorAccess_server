import { Request, Response, NextFunction } from 'express';
import * as Users from '../models/usersDao';
import { generateToken, isValidEmail, isValidRequestBody } from '../utils/utils';
import * as logger from '../utils/logger';
import config from '../config/config';
import { sendEmailConnexion } from '../mail/connexionMail';
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
                const token = generateToken(user.users_id);

                /* Save token */
                try {
                    Users.updateUserById(user.users_id, {users_token: token}).then((result) => {
                        user.users_token = result.users_token;
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
                sendEmailConnexion(email, appName, token).then(() => { // add route to the email
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


/**
 * Registers a new user with the provided information.
 * @POST /register
 * @param req Request
 * @param req.body.email Email address of the user
 * @param req.body.name Optional name of the user
 * @param res Return JWT for authentication or error
 * @param next NextFunction
 */
export const registerUser = (req: Request, res: Response, next: NextFunction) => {
    /* Verify body request */
    if (!isValidRequestBody(req.body, ['email', 'name'])) {
        res.status(400).json({ error: 'Invalid request body.' });
        return;
    }
    const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
    const name = Array.isArray(req.body.name) ? req.body.name[req.body.name.length-1] : req.body.name;

    if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email address.' });
        return;
    }

    try {
        /* Save and get user informations */
        Users.createUser(email, null, name).then((user) => {
            /* Generate JWT */
            const jwtPayload = {
                userId: user.users_id,
                email: user.users_email,
                name: user.users_name || '',
                ip: req.ip,
            };
            const jwt: string = JWT.sign(jwtPayload, config.jwt_signing_key, {
                expiresIn: config.jwt_expiration,
            });
            logger.debug("Generated JWT:", jwt);

            /* Return JWT */
            res.json({ jwt: jwt });
        }).catch((err) => {
            logger.error(err);
            res.status(400).json({ error: 'User not created !' });
            return;
        });
    } catch (error) {
        next(error);
    }
};


/**
 * Generates a JWT for the user based on the provided information.
 * @POST /jwt
 * @param req Request
 * @param req.query.email Email address of the user
 * @param req.query.token Token for verification
 * @param res Return JWT or error
 * @param next NextFunction
 */
export const getJwt = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify body request */
        const email = req.query.email instanceof Array ? req.query.email[req.query.email.length-1] : req.query.email;
        const token = req.query.token instanceof Array ? req.query.token[req.query.token.length-1] : req.query.token;
        if (!email || typeof email !== 'string' || !token || typeof token !== 'string') {
            res.status(400).json({ error: 'Invalid email address or token.' });
            return;
        }
        logger.debug("getJwt email :", email);
        logger.debug("getJwt token :", token);

        /* Get user informations */
        Users.getUserByEmailToken(email, token).then((user) => {
            if (!user) {
                res.status(400).json({ error: 'Invalid email or token.' });
                return;
            }
            logger.debug("getJwt user :", user);

            /* Verify token expiration */
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3 || isNaN(Number(tokenParts[1])) || Date.now() > Number(tokenParts[1])) {
                res.status(400).json({ error: 'Token has expired.' });
                return;
            }

            /* Verify user id */
            if (user.users_id !== Number(tokenParts[2])) {
                res.status(400).json({ error: 'Invalid email or token.' });
                return;
            }

            /* Generate JWT */
            console.debug("adresse ip :", req.ip);
            const jwtPayload = {
                userId: user.users_id,
                email: user.users_email,
                name: user.users_name || '',
                ip: req.ip,
            };
            const jwt: string = JWT.sign(jwtPayload, config.jwt_signing_key, {
                expiresIn: config.jwt_expiration, // Set expiration time from config
            });
            logger.debug("Generated JWT:", jwt);

            /* Return JWT */
            res.status(200).json({ jwt: jwt });
        }).catch((err) => {
            logger.error(err);
            res.status(400).json({ error: 'User not found !' });
            return;
        });
    } catch (error) {
        next(error);
    }
}