import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { AppError } from "../models/AppError.model";
import { verifyJwt } from "../utils/jwt";



/**
 * Middleware de validation de la clé 'Authorization' dans les headers.
 * @param schema Schéma Zod à utiliser pour la validation.
 * @throws AppError avec statut 400 si la validation échoue.
 */
export const authorizationValidator = (schema: ZodType) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
        schema.parse(req.headers.authorization);
        await verifyJwt(req.headers.authorization!.split(' ')[1]);
        next();
    } catch (error) {
        next(new AppError("Invalid JWT", 401));
    }
};