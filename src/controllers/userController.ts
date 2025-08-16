import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import * as logger from '../utils/logger';
import config from '../config/config';
import JWT from 'jsonwebtoken';
import { isValidEmail, isValidRequestBody } from '../utils/utils';



/**
 * Verifies the user's email and generates a JWT.
 * @GET /user/existing/:email
 * @param req Request
 * @param req.params.email Email address to verify
 * @param res Return whether the email exists or not
 * @param next NextFunction
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = Array.isArray(req.params.email) ? req.params.email[req.params.email.length-1] : req.params.email;
        if (!email || typeof email !== 'string' || !isValidEmail(email)) {
            res.status(400).json({ error: 'Invalid email address.' });
            return;
        }
        
        /* Get count user email */
        Users.getUserCountByEmail(email).then((count) => {
            res.status(200).json({ email: email, exists: Boolean(count) });
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
 * Registers a new user with the provided information.
 * @POST /user/register
 * @param req Request
 * @param req.body.email Email address of the user
 * @param req.body.name Optional name of the user
 * @param res Return JWT for authentication or error
 * @param next NextFunction
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    /* Verify body request */
    if (!isValidRequestBody(req.body, ['email'])) {
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
 * Updates a user by Id.
 * @param req Request
 * @param req.headers.authorization Authorization header containing the JWT
 * @param req.body.name Optional name of the user
 * @param req.body.email Optional email of the user
 * @param res Response
 * @param next NextFunction
 */
export const updateUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Get user id from JWT */
        const jwtPayload = JWT.verify(req.headers.authorization?.split(' ')[1] || '', config.jwt_signing_key) as { userId: number,
            email: string,
            name: string,
            ip: string
        };
        const id = jwtPayload.userId;

        /* Update user by id */
        Users.updateUserById(id, req.body).then((user) => {
            const newJwtPayload = {
                userId: user.users_id,
                email: user.users_email,
                name: user.users_name || '',
                ip: req.ip,
            };
            const newJwt: string = JWT.sign(newJwtPayload, config.jwt_signing_key, {
                expiresIn: config.jwt_expiration,
            });

            res.status(200).json({ jwt: newJwt, updated: true });
        }).catch((err: any) => {
            logger.error(err);
            res.status(400).json({ error: 'User not found or could not be updated.' });
            return;
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal server error.' });
        next(error);
    }
}

/**
 * Deletes a user by Id.
 * @param req Request
 * @param req.headers.authorization Authorization header containing the JWT
 * @param res Response
 * @param next NextFunction
 */
export const deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Get user id from JWT */
        const jwtPayload = JWT.verify(req.headers.authorization?.split(' ')[1] || '', config.jwt_signing_key) as { userId: number,
            email: string,
            name: string,
            ip: string
        };
        const id = jwtPayload.userId;

        /* Delete user by id */
        Users.deleteUserById(id).then(() => {
            res.status(200).json({ message: 'User deleted successfully.' });
        }).catch((err: any) => {
            logger.error(err);
            res.status(400).json({ error: 'User not found or could not be deleted.' });
            return;
        });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal server error.' });
        next(error);
    }
};