import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import { generateUserToken, isValidEmail, isValidRequestBody } from '../utils/utils';
import * as logger from '../utils/logger';
import config from '../config/config';
import { sendTokenEmail } from '../mail/tokenMail';
import JWT from 'jsonwebtoken';
import { getAuthorizedApiByName } from '../database/authorizedApiDao';
import { AuthorizedApi } from '../models/AuthorizedApiModel';
import { verifyJwt } from '../utils/securities';
import { User } from '../models/UsersModel';



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
            logger.debug("adresse ip :", req.ip);
            const jwtPayload = {
                userid: user.users_id,
                email: user.users_email,
                name: user.users_name || '',
                ip: req.ip,
            };
            const jwt: string = JWT.sign(jwtPayload, config.jwt_signing_key);
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

/**
 * Verify JWT passed in url params
 * @GET /jwt
 * @param req Request
 * @param req.params.jwt JWT to check
 * @param res Return JWT or error
 * @param next NextFunction
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify headers */
        if (!req.headers.authorization) {
            res.status(400).json({ error: 'Invalid Authorization header.' });
            return;
        }

        const authHeader = req.headers.authorization;
        const authParts = authHeader.split('.');


        /* Verify body request */
        const jwt = req.params.jwt;
        if (!jwt || typeof jwt !== 'string') {
            res.status(400).json({ error: 'Invalid JWT.' });
            return;
        }

        /* Verify JWT */
        JWT.verify(jwt, config.jwt_signing_key, (err, decoded) => {
            if (err) {
                res.status(200).json({ 
                    valid: false,
                    error: 'Invalid or expired JWT.'
                });
                return;
            }

            res.status(200).json({ valid: true });
        });
    } catch (error) {
        next(error);
    }
}


/**
 * Retrieves user information from the JWT in the request headers.
 * @GET /jwt/user
 * @param req Request
 * @param req.headers.authorization Authorization header containing the API token
 * @param req.query.jwt JWT to verify
 * @param res Response
 * @param next NextFunction
 * @returns User information or error response
 */
export const getUserFromJwt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify headers */
        if (!req.headers.authorization) {
            res.status(401).send();
            logger.debug("40X");
            return;
        }

        const authHeader: string[] = req.headers.authorization.split(' ');
        if (authHeader.length !== 2) {
            res.status(401).send();
            logger.debug("40X");
            return;
        }

        const api: AuthorizedApi | null = await getAuthorizedApiByName(authHeader[0]);
        if (!api) {
            res.status(401).send();
            logger.debug("40X");
            return;
        }

        if (api.api_privatetoken !== authHeader[1]) {
            res.status(401).send();
            logger.debug("40X");
            return;
        }

        const jwtRaw = req.query.jwt instanceof Array ? req.query.jwt[req.query.jwt.length-1].toString() : req.query.jwt?.toString();
        if (!jwtRaw || typeof jwtRaw !== 'string') {
            res.status(400).json({ error: 'Invalid JWT.' });
            logger.debug("40X");
            return;
        }
        const jwt: string = jwtRaw;

        /* Verify JWT */
        verifyJwt(jwt).then((user: User|null) => {
            if (!user || !user.users_id) {
                res.status(422).json({ error: 'Invalid or expired JWT.' });
                logger.debug("40X");
                return;
            }
            res.status(200).json({
                userid: user.users_id,
                email: user.users_email,
                name: user.users_name,
                authmethod: user.users_authmethod,
            });
        }).catch((err: Error) => {
            logger.error("JWT verification error :", err);
            next(err);
        });
    } catch (error) {
        logger.error("Error in getUserFromJwt :", error);
        next(error);
    }
}