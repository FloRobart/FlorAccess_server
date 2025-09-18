import { Request, Response, NextFunction } from 'express';
import * as logger from '../utils/logger';
import { internalMessage, AppError } from '../models/ErrorModel';



/**
 * Middleware to handle errors.
 * @param err Error object
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(err);
    res.status(err.httpStatus).json({
        message: err.message || 'Internal Server Error',
        internalStatus: err.internalStatus,
        internalMessage: internalMessage[err.internalStatus] || internalMessage[1],
    });
};
