import { Request, Response, NextFunction } from 'express';
import * as Users from '../database/usersDao';
import config from '../config/config';
import JWT from 'jsonwebtoken';
import { isValidEmail, isValidRequestBody } from '../utils/utils';
import { getJwt, verifyJwt } from '../utils/securities';
import { User } from '../models/UsersModel';
import { AppError } from '../models/ErrorModel';



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
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify headers */
        if (!req.headers.authorization) {
            next(new AppError({message: "Unauthorized", httpStatus: 401}));
            return;
        }

        const authHeader: string[] = req.headers.authorization.split(' ');
        if (authHeader.length !== 2 || authHeader[0] !== 'Bearer') {
            next(new AppError({message: "Unauthorized", httpStatus: 401}));
            return;
        }

        const jwt: string = authHeader[1];

        /* Verify JWT */
        verifyJwt(jwt).then((user: User|null) => {
            if (!user || !user.users_id) {
                next(new AppError({message: "Invalid or expired JWT", httpStatus: 401}));
                return;
            }
            res.status(200).json({
                userid: user.users_id,
                email: user.users_email,
                name: user.users_name,
                authmethod: user.users_authmethod,
            });
        }).catch((err: Error) => {
            next(new AppError({stackTrace: err}));
        });
    } catch (err) {
        next(new AppError({stackTrace: err}));
    }
}

/**
 * Logs out a user by invalidating the JWT token.
 * @POST /user/logout
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Success message or error response
 */
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Invalidate JWT */
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            next(new AppError({message: "Unauthorized", httpStatus: 401}));
            return;
        }

        verifyJwt(token).then((user: User|null) => {
            if (!user || !user.users_id) {
                next(new AppError({message: "Invalid or expired JWT", httpStatus: 401}));
                return;
            }

            res.status(200).json({
                email: user.users_email,
                name: user.users_name,
                authmethod: user.users_authmethod,
            });
        }).catch((err: Error) => {
            next(new AppError({stackTrace: err}));
        });
    } catch (err) {
        next(new AppError({stackTrace: err}));
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
        next(new AppError({message: "Invalid request body", httpStatus: 400}));
        return;
    }
    const email = Array.isArray(req.body.email) ? req.body.email[req.body.email.length-1] : req.body.email;
    const name = Array.isArray(req.body.name) ? req.body.name[req.body.name.length-1] : req.body.name;

    if (!isValidEmail(email)) {
        next(new AppError({message: "Invalid email address", httpStatus: 400}));
        return;
    }

    /* Save and get user informations */
    Users.createUser(email, null, name).then(async (user) => {
        /* Generate JWT */
        const jwt = await getJwt(user);

        /* Return JWT */
        res.status(201).json({ jwt: jwt });
    }).catch((err: Error) => {
        next(new AppError({message: "User not created", httpStatus: 400, stackTrace: err}));
    });
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
        const jwtPayload = JWT.verify(req.headers.authorization?.split(' ')[1] || '', config.jwt_signing_key) as {
            userid: number,
            email: string,
            name: string,
            ip: string
        };
        const id = jwtPayload.userid;

        /* Update user by id */
        Users.updateUserById(id, req.body).then(async (user) => {
            const newJwt: string = await getJwt(user);

            res.status(200).json({ jwt: newJwt, updated: true });
        }).catch((err: Error) => {
            next(new AppError({message: "User not found or could not be updated", httpStatus: 400, stackTrace: err}));
        });
    } catch (err) {
        next(new AppError({stackTrace: err}));
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
        const jwtPayload = JWT.verify(req.headers.authorization?.split(' ')[1] || '', config.jwt_signing_key) as {
            userid: number,
            email: string,
            name: string,
            ip: string
        };
        const id = jwtPayload.userid;

        /* Delete user by id */
        Users.deleteUserById(id).then(() => {
            res.status(200).json({ message: 'User deleted successfully.' });
        }).catch((err: Error) => {
            next(new AppError({message: "User not found or could not be deleted", httpStatus: 400, stackTrace: err}));
        });
    }
    catch (err) {
        next(new AppError({stackTrace: err}));
    }
};