import type { NextFunction, Request, Response } from "express";
import type { UserAdmin, UserAdminUpdate } from "./admins.types";
import type { InsertUser } from "../users/users.types";

import * as AdminsService from "./admins.service";
import AppConfig from "../../config/AppConfig";
import { UserAdminSchema, UserAdminUpdateSchema, UserIdSchema } from "./admins.schema";



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
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const userId: number = req.body.validatedData.userId;
    const updateUserData: UserAdminUpdate = UserAdminUpdateSchema.parse(req.body.validatedData);

    console.debug("AdminsController.updateUser - userId:", userId);
    console.debug("AdminsController.updateUser - updateUserData:", updateUserData);

    try {
        const updatedUser: UserAdmin = await AdminsService.updateUser(userId, updateUserData);
        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};
