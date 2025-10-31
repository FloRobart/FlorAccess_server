import { Request, Response, NextFunction } from 'express';
import * as logger from '../utils/logger';
import { AppError } from '../models/AppError.model';



/**
 * Middleware to handle errors.
 * @param err Error object
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error.httpStatus >= 500) {
        logger.error(error.stack);
    } else if (error.httpStatus >= 400) {
        logger.warning(error.stack);
    } else {
        logger.info(error.stack);
    }

    res.status(error.httpStatus || 500).json(error.message || "Internal Server Error");
};
