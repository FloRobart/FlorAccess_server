import type { NextFunction, Request, Response } from "express";
import type { UserAdmin } from "./admins.types";

import * as AdminsService from "./admins.service";



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