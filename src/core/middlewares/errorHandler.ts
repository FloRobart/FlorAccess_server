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
    if (err.httpStatus >= 500) {
        logger.error(err.toString());
    } else if (err.httpStatus >= 400) {
        logger.warning(err.toString());
    } else {
        logger.info(err.toString());
    }

    res.status(err.httpStatus).json({
        message: err.message || 'Internal Server Error',
        internalStatus: err.internalStatus,
        internalMessage: internalMessage[err.internalStatus] || internalMessage[1],
    });
};
