import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import * as logger from '../utils/logger';
import config from '../config/config';
import JWT from 'jsonwebtoken';
import { isValidEmail, isValidRequestBody } from '../utils/utils';
import { getJwt } from '../utils/securities';



export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Invalidate JWT */
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized. Invalid or missing JWT token' });
            return;
        }

        JWT.verify(token, config.jwt_signing_key, (err) => {
            if (err) {
                res.status(401).json({ error: 'Unauthorized. Invalid or expired JWT token' });
                return;
            }

            res.status(202).json({ message: 'User logout comming soon.' });
            // /* Logout user */
            // Users.logoutUser(token).then(() => {
            //     res.status(200).json({ message: 'User logged out successfully.' });
            // }).catch((err) => {
            //     logger.error(err);
            //     res.status(500).json({ error: 'Internal server error.' });
            // });
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal server error.' });
        next(error);
    }
};

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
        Users.createUser(email, null, name).then(async (user) => {
            /* Generate JWT */
            const jwt = await getJwt(user);

            logger.debug("Generated JWT:", jwt);

            /* Return JWT */
            res.status(201).json({ jwt: jwt });
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
        const jwtPayload = JWT.verify(req.headers.authorization?.split(' ')[1] || '', config.jwt_signing_key) as { userid: number,
            email: string,
            name: string,
            ip: string
        };
        const id = jwtPayload.userid;

        /* Update user by id */
        Users.updateUserById(id, req.body).then(async (user) => {
            const newJwt: string = await getJwt(user);

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
        const jwtPayload = JWT.verify(req.headers.authorization?.split(' ')[1] || '', config.jwt_signing_key) as { userid: number,
            email: string,
            name: string,
            ip: string
        };
        const id = jwtPayload.userid;

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