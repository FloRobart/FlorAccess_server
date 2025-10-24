import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../../models/AppError.model";
import * as logger from "../../utils/logger";



/**
 * Middleware générique de validation du corps de la requête avec Zod.
 * @param schema Schéma Zod à utiliser pour la validation.
 * @returns Middleware Express avec req.body.validated contenant les données validées.
 * @throws AppError avec statut 400 si la validation échoue.
 */
export const paramsQueryValidator = (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    try {
        req.body = { validated: schema.parse({ ...req.params, ...req.query }) };
        next();
    } catch (error) {
        logger.error("Validation failed:", error);
        next(new AppError("Invalid request data", 400));
    }
};