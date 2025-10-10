import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { AppError } from "../models/ErrorModel";



/**
 * Middleware générique de validation du corps de la requête avec Zod.
 * @param schema Schéma Zod à utiliser pour la validation.
 * @returns Middleware Express avec req.body.validated contenant les données validées.
 * @throws AppError avec statut 400 si la validation échoue.
 */
export const bodyValidator = (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    try {
        req.body.validated = schema.parse(req.body);
        next();
    } catch (error) {
        const stackTrace = error instanceof ZodError ? JSON.stringify(error.issues) : error;
        next(new AppError({ message: "Invalid request data", httpStatus: 400, stackTrace: stackTrace }));
    }
};