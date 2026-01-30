import type { NextFunction, Request, Response } from "express";
import type { EmailAdmin, UserAdmin, UserAdminUpdate, UserIdList } from "./admins.types";
import type { InsertUser } from "../users/users.types";

import * as AdminsService from "./admins.service";
import AppConfig from "../../config/AppConfig";
import { EmailAdminSchema, UserAdminUpdateSchema, UserIdListSchema, UserIdSchema } from "./admins.schema";



/*========*/
/* INSERT */
/*========*/
/**
 * Registers a new user.
 * @param req.body.validated insertUser object containing the information of the user to create
 * @param res Response object
 * @param next NextFunction for error handling
 * @returns Newly created UserAdmin object or error response
 */
export const insertUser = async (req: Request, res: Response, next: NextFunction) => {
    const insertUser: InsertUser = req.body.validated;

    try {
        const userAdmin: UserAdmin = await AdminsService.insertUser(insertUser, AppConfig.app_name);
        res.status(201).send(userAdmin);
    } catch (error) {
        next(error);
    }
};


/*========*/
/* SELECT */
/*========*/
/**
 * Retrieves no sensitive information about all users.
 * @returns List of UserAdmin objects or error response
 */
export const selectUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const userAdmin: UserAdmin[] = await AdminsService.selectUsers();
        res.status(200).json(userAdmin);
    } catch (error) {
        next(error);
    }
};


/*========*/
/* UPDATE */
/*========*/
/**
 * Updates a user.
 * @param req Request object containing the user ID and update data
 * @param res Response object
 * @param next NextFunction for error handling
 * @returns Updated UserAdmin object or error response
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const userId: number = UserIdSchema.parse(req.body.validatedData).userId;
    const updateUserData: UserAdminUpdate = UserAdminUpdateSchema.parse(req.body.validatedData);

    try {
        const updatedUser: UserAdmin = await AdminsService.updateUser(userId, updateUserData);
        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};


/*========*/
/* DELETE */
/*========*/
/**
 * Deletes a user.
 * @param req Request object containing the user ID to delete
 * @param res Response object
 * @param next NextFunction for error handling
 * @returns Success message or error response
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const userId: number = UserIdSchema.parse(req.body.validatedData).userId;

    try {
        await AdminsService.deleteUser(userId);
        res.status(200).send();
    } catch (error) {
        next(error);
    }
};


/*=======*/
/* Email */
/*=======*/
/**
 * Sends verification emails to a list of users.
 * @param req Request object containing the list of user IDs
 * @param res Response object
 * @param next NextFunction for error handling
 * @returns List of user IDs of users to whom the verification email was sent or error response
 */
export const sendVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    const userIdList: UserIdList = UserIdListSchema.parse(req.body.validatedData);

    try {
        const userIdListSuccess: UserIdList = await AdminsService.sendVerifyEmail(userIdList);
        res.status(200).json(userIdListSuccess);
    } catch (error) {
        next(error);
    }
};

/**
 * Sends emails to a list of users.
 * @param req Request object containing the email data
 * @param res Response object
 * @param next NextFunction for error handling
 * @returns List of user IDs of users to whom the email was sent or error response
 */
export const sendEmailAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const emailAdmin: EmailAdmin = EmailAdminSchema.parse(req.body.validatedData);

    try {
        const userIdListSuccess: UserIdList = await AdminsService.sendEmailAdmin(emailAdmin);
        res.status(200).json(userIdListSuccess);
    } catch (error) {
        next(error);
    }
};
