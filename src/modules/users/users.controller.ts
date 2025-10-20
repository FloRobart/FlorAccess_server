import { Request, Response, NextFunction } from 'express';
import * as UsersService from './users.service';
import { AppError } from '../../core/models/ErrorModel';
import { InsertUser, IPAddress, UserLoginRequest, UpdateUser, UserSafe } from './users.types';
import { IPAddressSchema } from './users.schema';



/**
 * Registers a new user with the provided information.
 * @param req.body.validated insertUser object containing the information of the user to create
 * @returns JWT for the newly created user or error response
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
 * @param req.headers.authorization Authorization header containing the JWT
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
 * Updates a user's information
 * @param req.headers.authorization Authorization header containing the JWT
 * @param req.body.validated updateUser object with the updated user information
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


/**
 * Deletes a user
 * @param req.headers.authorization Authorization header containing the JWT
 * @returns Success message
 * @throws Error if user deletion fails or if the token is invalid.
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];

    UsersService.deleteUser(jwt).then(() => {
        res.status(200).json({ message: 'User deleted successfully.' });
    }).catch((error: AppError) => {
        next(error);
    });
};


/**
 * Logs in a user by generating a JWT based on the user's email.
 * @param req.body.validated email of the user to log in
 * @returns Token to confirm user login
 * @throws Error if login fails or if the email is invalid.
 */
export const userLoginRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userLoginRequest: UserLoginRequest = req.body.validated;

    UsersService.userLoginRequest(userLoginRequest).then((token: string) => {
        res.status(200).json({ token: token });
    }).catch((error: AppError) => {
        next(error);
    });
};


/**
 * Logs out a user by invalidating the JWT token.
 * @param req.headers.authorization Authorization header containing the JWT
 * @returns Success message
 * @throws Error if logout fails or if the token is invalid.
 */
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];

    UsersService.logoutUser(jwt).then(() => {
        res.status(200).json({ message: 'User logged out successfully.' });
    }).catch((error: AppError) => {
        next(error);
    });
};
