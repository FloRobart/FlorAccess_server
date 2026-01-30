import { Request, Response, NextFunction } from "express";
import z, { ZodError, ZodType } from "zod";
import { AppError } from "../../models/AppError.model";
import logger from "../../utils/logger";



/**
 * Middleware générique de validation du corps de la requête avec Zod.
 * @param schema Schéma Zod à utiliser pour la validation.
 * @returns Middleware Express avec req.body.validated contenant les données validées.
 * @throws AppError avec statut 400 si la validation échoue.
 */
export const requestValidator = (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    try {
        let validatedData: z.infer<typeof schema> = schema.parse({...req.body, ...req.params, ...req.query});
        if (validatedData === null || !(typeof validatedData === "object")) {
            throw new AppError("Bad Request", 400);
        }

        req.body = { ...req.body, validatedData: { ...req.body?.validatedData, ...validatedData }};
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            logger.error(JSON.stringify(error.issues));
        }

        next(error instanceof AppError ? error : new AppError("Bad Request", 400));
    }
};
