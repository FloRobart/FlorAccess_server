import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import * as logger from '../utils/logger';
import config from '../config/config';
import { getAuthorizedApiByName, updateAuthorizedApi } from '../database/authorizedApiDao';
import { AuthorizedApi } from '../models/AuthorizedApiModel';




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
            res.status(400).send();
            return;
        }

        const authorizationToken = req.headers['authorization'].split(' ')[1];
        if (authorizationToken !== config.handshake_static_token) {
            res.status(401).send();
            return;
        }

        const params: string[] = Buffer.from(req.query['params'].toString(), 'base64').toString('binary').split('.');
        const apiName = params[0];
        const apiPrivateTokenHash = params[1];
        const apiLastAccess = parseInt(params[2], 10);
        const savedApi: AuthorizedApi | null = await getAuthorizedApiByName(apiName);

        if (params.length !== 3) {
            res.status(422).send();
            return;
        }

        if (!apiName || !apiPrivateTokenHash || isNaN(apiLastAccess) || savedApi === null) {
            res.status(400).send();
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

        res.status(400).send();
    } catch (error) {
        logger.error('Error during handshake :', error);
        next(error);
    }
};