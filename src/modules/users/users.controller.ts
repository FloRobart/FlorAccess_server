import type { InsertUser, IPAddress, UserLoginRequest, UpdateUser, UserSafe, UserLoginConfirm, UserEmailVerification } from './users.types';

import { Request, Response, NextFunction } from 'express';
import * as UsersService from './users.service';
import * as UsersSchema from './users.schema';
import { IPAddressSchema } from './users.schema';
import AppConfig from '../../config/AppConfig';



/**
 * Registers a new user with the provided information.
 * @param req.body.validated insertUser object containing the information of the user to create
 * @param req.ip IP address of the user
 * @param req.query.application Application name from which the user is being created
 * @param req.query.domain Domain associated with the user
 * @returns JWT for the newly created user or error response
 */
export const insertUser = async (req: Request, res: Response, next: NextFunction) => {
    const insertUser: InsertUser = UsersSchema.UserInsertSchema.parse(req.body.validatedData);
    const ip: IPAddress | null = IPAddressSchema.safeParse(req.ip).data || null;
    const application: string = req.query.application as string || AppConfig.app_name;
    const domain: string | null = req.query.domain as string || null;

    try {
        const jwt: string = await UsersService.insertUser(insertUser, ip, application, domain);
        res.status(201).json({ jwt: jwt });
    } catch (error) {
        next(error);
    }
};


/**
 * Retrieves user information from the JWT in the request headers.
 * @param req.headers.authorization Authorization header containing the JWT
 * @returns User information or error response
 */
export const selectUser = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];

    try {
        const userSafe: UserSafe = await UsersService.selectUser(jwt);
        res.status(200).json(userSafe);
    } catch (error) {
        next(error);
    }
};


/**
 * Regenerates a JWT for the user based on the provided JWT.
 * @param req.headers.authorization Authorization header containing the JWT
 * @returns New JWT for the user or error response
 */
export const regenerateJwt = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];

    try {
        const newJwt: string = await UsersService.regenerateJwt(jwt);
        res.status(200).json({ jwt: newJwt });
    } catch (error) {
        next(error);
    }
};


/**
 * Updates a user's information
 * @param req.headers.authorization Authorization header containing the JWT
 * @param req.body.validated updateUser object with the updated user information
 * @returns Updated JWT or error response
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const updateUser: UpdateUser = UsersSchema.UserUpdateSchema.parse(req.body.validatedData);
    const jwt: string = req.headers.authorization!.split(' ')[1];

    try {
        const newJwt: string = await UsersService.updateUser(updateUser, jwt);
        res.status(200).json({ jwt: newJwt });
    } catch (error) {
        next(error);
    }
};


/**
 * Deletes a user
 * @param req.headers.authorization Authorization header containing the JWT
 * @returns Success message
 * @throws Error if user deletion fails or if the token is invalid.
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];

    try {
        await UsersService.deleteUser(jwt);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        next(error);
    }
};


/**
 * Logs in a user by generating a JWT based on the user's email.
 * @param req.body.validated email of the user to log in
 * @returns Token to confirm user login
 * @throws Error if login fails or if the email is invalid.
 */
export const userLoginRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userLoginRequest: UserLoginRequest = UsersSchema.UserLoginRequestSchema.parse(req.body.validatedData);

    try {
        const token: string = await UsersService.userLoginRequest(userLoginRequest);
        res.status(200).json({ token: token });
    } catch (error) {
        next(error);
    }
};


/**
 * Confirms a user's login by validating the JWT and IP address.
 * @param req The request object containing the JWT and user information.
 * @param res The response object to send the JWT or error message.
 * @param next The next middleware function.
 */
export const userLoginConfirm = async (req: Request, res: Response, next: NextFunction) => {
    const userLoginConfirm: UserLoginConfirm = UsersSchema.UserLoginConfirmSchema.parse(req.body.validatedData);
    const ip: IPAddress | null = IPAddressSchema.safeParse(req.ip).data || null;
    userLoginConfirm.ip = ip;

    try {
        const jwt = await UsersService.userLoginConfirm(userLoginConfirm);
        res.status(200).json({ jwt: jwt });
    } catch (error) {
        next(error);
    }
};


/**
 * Logs out a user by invalidating the JWT token.
 * @param req.headers.authorization Authorization header containing the JWT
 * @returns Success message
 * @throws Error if logout fails or if the token is invalid.
 */
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    const jwt: string = req.headers.authorization!.split(' ')[1];

    try {
        await UsersService.logoutUser(jwt);
        res.status(200).json({ message: 'User logged out successfully.' });
    } catch (error) {
        next(error);
    }
};


/** * Verifies a user's email using the provided token.
 * @param req.body.validated UserEmailVerification object containing the verification token and other details.
 * @returns HTML content indicating the result of the email verification.
 * @throws Error if email verification fails or if the token is invalid.
 */
export const UserEmailVerify = async (req: Request, res: Response, next: NextFunction) => {
    const userEmailVerification: UserEmailVerification = UsersSchema.UserEmailVerificationSchema.parse(req.body.validatedData);

    try {
        const html = await UsersService.UserEmailVerify(userEmailVerification);

        res.status(200).type('html').send(html);
    } catch (error: any) {
        next(error);
    }
};
