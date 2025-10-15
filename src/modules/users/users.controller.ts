import { Request, Response, NextFunction } from 'express';
import * as UsersService from './users.service';
import { AppError } from '../../core/models/ErrorModel';
import { InsertUser, IPAddress, UpdateUser, User, UserSafe } from './users.types';
import { IPAddressSchema } from './users.schema';



/**
 * Registers a new user with the provided information.
 * @POST /users
 * @param req Request
 * @param req.body.validated.email Email address of the user
 * @param req.body.validated.name Optional name of the user
 * @param res Return JWT for authentication or error
 * @param next NextFunction
 */
export const insertUser = async (req: Request, res: Response, next: NextFunction) => {
    const insertUser: InsertUser = req.body.validated;
    const ip: IPAddress | null = IPAddressSchema.safeParse(req.ip).data || null;

    UsersService.insertUser(insertUser, ip).then((jwt: string) => {
        res.status(201).json({ jwt: jwt });
    }).catch((error: Error) => {
        next(new AppError({ message: error.message, httpStatus: 500, stackTrace: error }));
    });
};


/**
 * Retrieves user information from the JWT in the request headers.
 * @GET /users
 * @param req Request
 * @param req.headers.authorization Authorization header containing the API token
 * @param res Response
 * @param next NextFunction
 * @returns User information or error response
 */
export const selectUser = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];
    UsersService.selectUser(jwt).then((userSafe: UserSafe) => {
        res.status(200).json(userSafe);
    }).catch((error: Error) => {
        next(new AppError({ message: error.message, httpStatus: 500, stackTrace: error }));
    });
};


/**
 * Updates a user's information.
 * @PUT /users
 * @param req Request
 * @param req.headers.authorization Authorization header containing the JWT
 * @param req.body.name Optional name of the user
 * @param req.body.email Optional email of the user
 * @param res Response
 * @param next NextFunction
 * @returns Updated JWT or error response
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const updateUser: UpdateUser = req.body.validated;
    const jwt: string = req.headers.authorization!.split(' ')[1];

    UsersService.updateUser(updateUser, jwt).then((newJwt: string) => {
        res.status(200).json({ jwt: newJwt });
    }).catch((error: Error) => {
        next(new AppError({ message: "User could not be updated", httpStatus: 500, stackTrace: error }));
    });
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];

    UsersService.deleteUser(jwt).then(() => {
        res.status(200).json({ message: 'User deleted successfully.' });
    }).catch((error: AppError) => {
        next(error);
    });
};




/**
 * Logs out a user by invalidating the JWT token.
 * @POST /user/logout
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Success message or error response
 */
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    // try {
    //     /* Invalidate JWT */
    //     const token = req.headers.authorization?.split(' ')[1];
    //     if (!token) {
    //         next(new AppError({ message: "Unauthorized", httpStatus: 401 }));
    //         return;
    //     }

    //     verifyJwt(token).then((user: User | null) => {
    //         if (!user || !user.users_id) {
    //             next(new AppError({ message: "Invalid or expired JWT", httpStatus: 401 }));
    //             return;
    //         }

    //         res.status(200).json({
    //             email: user.users_email,
    //             name: user.users_name,
    //             authmethod: user.users_authmethod,
    //         });
    //     }).catch((err: Error) => {
    //         next(new AppError({ stackTrace: err }));
    //     });
    // } catch (err) {
    //     next(new AppError({ stackTrace: err }));
    // }
};
