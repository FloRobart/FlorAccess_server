import { Request, Response, NextFunction } from 'express';
import * as Users from '../models/usersDao';
import * as logger from '../utils/logger';
import config from '../config/config';
import JWT from 'jsonwebtoken';
import { isValidEmail } from '../utils/utils';



/**
 * Verifies the user's email and generates a JWT.
 * @GET /email/existing/:email
 * @param req Request
 * @param req.params.email Email address of the user
 * @param res Return whether the email exists or not
 * @param next NextFunction
 */
export const verifyEmail = (req: Request, res: Response, next: NextFunction) => {
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
 * Updates a user by Id.
 * @param req Request
 * @param req.headers.authorization Authorization header containing the JWT
 * @param res Response
 * @param next NextFunction
 */
export const updateUserById = (req: Request, res: Response, next: NextFunction) => {
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
            res.status(200).json({ message: 'User updated successfully.', user });
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
export const deleteUserById = (req: Request, res: Response, next: NextFunction) => {
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