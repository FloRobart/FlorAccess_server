import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { AppError } from "../models/ErrorModel";



/**
 * Middleware de validation de la clé 'Authorization' dans les headers.
 * @param schema Schéma Zod à utiliser pour la validation.
 * @throws AppError avec statut 400 si la validation échoue.
 */
export const authorizationValidator = (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    try {
        schema.parse(req.headers.authorization);
        next();
    } catch (error) {
        const stackTrace = error instanceof ZodError ? JSON.stringify(error.issues) : error;
        next(new AppError({ message: "Invalid JWT format", httpStatus: 400, stackTrace: stackTrace }));
    }
};