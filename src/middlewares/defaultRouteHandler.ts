import { Request, Response, NextFunction } from 'express';
import { AppError } from '../models/ErrorModel';



/**
 * Middleware to handle undefined routes.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const defaultRouteHandler = (req: Request, res: Response, next: NextFunction) => {
    next(new AppError({"message": "URL not found", "httpStatus": 404, "internalStatus": 2}));
}
