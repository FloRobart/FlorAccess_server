import type { UserSafe } from "../../../modules/users/users.types";

import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../../models/AppError.model";
import { verifyJwt } from "../../utils/jwt";
import { isAdmin } from "../../../modules/admins/admins.service";



/**
 * Middleware de validation de la clé 'Authorization' dans les headers.
 * @param schema Schéma Zod à utiliser pour la validation.
 * @throws AppError avec statut 400 si la validation échoue.
 */
export const adminsAuthorizationValidator = (schema: ZodType) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
        schema.parse(req.headers.authorization);
        const userSafe: UserSafe = verifyJwt(req.headers.authorization!.split(' ')[1]);
        const isAdminUser = await isAdmin(userSafe);
        if (!isAdminUser) {
            throw new AppError("Unauthorized: Admin access required", 403);
        }

        next();
    } catch (error) {
        next(error instanceof AppError ? error : new AppError("Invalid Authorization header", 401));
    }
};