import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { AppError } from "../models/ErrorModel";

/**
 * Middleware générique de validation Zod.
 * 
 * @param schema Schéma Zod à utiliser pour la validation.
 * @returns Middleware Express qui valide req.body, req.query et req.params.
 */
export const bodyValidateSchema =
    (schema: ZodTypeAny) =>
    (req: Request, _res: Response, next: NextFunction) => {
        try {
            req.body.validated = schema.parse(req.body);
            next();
        } catch (error) {
            const stackTrace = error instanceof ZodError ? JSON.stringify(error.issues) : error;
            next(new AppError({ message: "Invalid request data", httpStatus: 400, stackTrace: stackTrace }) );
        }
  };