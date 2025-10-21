import { Request, Response, NextFunction } from 'express';
import { AppError } from '../models/AppError.model';



/**
 * Middleware to handle undefined routes.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const defaultRouteHandler = (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError("URL not found", 404));
}
