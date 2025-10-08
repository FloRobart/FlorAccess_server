import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import config from '../../config/config';
import { getAuthorizedApiByName, updateAuthorizedApi } from './authorizedApi.repository';
import { AuthorizedApi } from './AuthorizedApi.schema';
import { AppError } from '../../core/models/ErrorModel';




/**
 * Sends a token to the email address provided in the request body.
 * @POST /handshake
 * @param req Request
 * @param res Return success message or error
 * @param next NextFunction
 */
export const handshake = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.query['params'] || !req.headers['authorization']) {
            next(new AppError({ message: "Missing parameters or http headers", httpStatus: 400 }));
            return;
        }

        const authorizationToken = req.headers['authorization'].split(' ')[1];
        if (authorizationToken !== config.handshake_static_token) {
            next(new AppError({ message: "Unauthorized", httpStatus: 401 }));
            return;
        }

        const params: string[] = Buffer.from(req.query['params'].toString(), 'base64').toString('binary').split('.');
        const apiName = params[0];
        const apiPrivateTokenHash = params[1];
        const apiLastAccess = parseInt(params[2], 10);
        const savedApi: AuthorizedApi | null = await getAuthorizedApiByName(apiName);

        if (params.length !== 3) {
            next(new AppError({ message: "Invalid parameters", httpStatus: 422 }));
            return;
        }

        if (!apiName || !apiPrivateTokenHash || isNaN(apiLastAccess) || savedApi === null) {
            next(new AppError({ message: "Invalid parameters", httpStatus: 400 }));
            return;
        }

        if ((createHash(config.hash_algorithm).update(savedApi.api_privatetoken || "").digest('hex') === apiPrivateTokenHash) &&
            (apiLastAccess === Number(savedApi.api_lastaccess)) &&
            (apiName === savedApi.api_name)
        ) {
            res.status(200).send();
            savedApi.api_tokenvalidation = true;
            updateAuthorizedApi(savedApi);
            return;
        }

        next(new AppError({ message: "Invalid token", httpStatus: 400 }));
    } catch (err) {
        next(new AppError({ stackTrace: err }));
    }
};