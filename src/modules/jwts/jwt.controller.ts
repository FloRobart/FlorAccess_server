import { Request, Response, NextFunction } from 'express';
import * as Users from '../users/users.repository';
import config from '../../config/config';
import JWT from 'jsonwebtoken';
import { getAuthorizedApiByName } from '../handshakes/authorizedApi.repository';
import { AuthorizedApi } from '../handshakes/AuthorizedApi.schema';
import { verifyJwt } from '../../core/utils/securities';
import { User } from '../users/users.schema';
import { AppError } from '../../core/models/ErrorModel';



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
        const email = req.query.email instanceof Array ? req.query.email[req.query.email.length - 1] : req.query.email;
        const token = req.query.token instanceof Array ? req.query.token[req.query.token.length - 1] : req.query.token;
        if (!email || typeof email !== 'string' || !token || typeof token !== 'string') {
            next(new AppError({ message: "Invalid email address or token.", httpStatus: 400 }));
            return;
        }

        /* Get user informations */
        Users.getUserByEmailToken(email, token).then((user) => {
            if (!user) {
                next(new AppError({ message: "Invalid email or token.", httpStatus: 400 }));
                return;
            }

            /* Verify token expiration */
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3 || isNaN(Number(tokenParts[1])) || Date.now() > Number(tokenParts[1])) {
                next(new AppError({ message: "Token has expired.", httpStatus: 400 }));
                return;
            }

            /* Verify user id */
            if (user.users_id !== Number(tokenParts[2])) {
                next(new AppError({ message: "Invalid email or token.", httpStatus: 400 }));
                return;
            }

            /* Generate JWT */
            const jwtPayload = {
                userid: user.users_id,
                email: user.users_email,
                name: user.users_name || '',
                ip: req.ip,
            };
            const jwt: string = JWT.sign(jwtPayload, config.jwt_signing_key);

            /* Return JWT */
            res.status(200).json({ jwt: jwt });
        }).catch((err) => {
            next(new AppError({ message: "User not found", httpStatus: 404 }));
            return;
        });
    } catch (err) {
        next(new AppError({ stackTrace: err }));
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
            next(new AppError({ message: "Invalid Authorization header.", httpStatus: 400 }));
            return;
        }

        /* Verify body request */
        const jwt = req.params.jwt;
        if (!jwt || typeof jwt !== 'string') {
            next(new AppError({ message: "Invalid JWT.", httpStatus: 400 }));
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
    } catch (err) {
        next(new AppError({ stackTrace: err }));
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
            next(new AppError({ message: "Unauthorized", httpStatus: 401 }));
            return;
        }

        const authHeader: string[] = req.headers.authorization.split(' ');
        if (authHeader.length !== 2) {
            next(new AppError({ message: "Unauthorized", httpStatus: 401 }));
            return;
        }

        const api: AuthorizedApi | null = await getAuthorizedApiByName(authHeader[0]);
        if (!api) {
            next(new AppError({ message: "Unauthorized", httpStatus: 401 }));
            return;
        }

        if (api.api_privatetoken !== authHeader[1]) {
            next(new AppError({ message: "Unauthorized", httpStatus: 401 }));
            return;
        }

        const jwtRaw = req.query.jwt instanceof Array ? req.query.jwt[req.query.jwt.length - 1].toString() : req.query.jwt?.toString();
        if (!jwtRaw || typeof jwtRaw !== 'string') {
            next(new AppError({ message: "Invalid JWT.", httpStatus: 400 }));
            return;
        }
        const jwt: string = jwtRaw;

        /* Verify JWT */
        verifyJwt(jwt).then((user: User | null) => {
            if (!user || !user.users_id) {
                next(new AppError({ message: "Invalid or expired JWT", httpStatus: 422 }));
                return;
            }
            res.status(200).json({
                userid: user.users_id,
                email: user.users_email,
                name: user.users_name,
                authmethod: user.users_authmethod,
            });
        }).catch((err: Error) => {
            next(new AppError({ stackTrace: err }));
        });
    } catch (err) {
        next(new AppError({ stackTrace: err }));
    }
}