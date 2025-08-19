import { getAllAuthorizedApi, updateAuthorizedApi } from '../database/authorizedApiDao';
import { AuthorizedApi } from '../models/AuthorizedApiModel';
import http from 'http';
import * as logger from '../utils/logger';
import config from '../config/config';
import { generateApiToken } from '../utils/utils';



/**
 * Initializes the authorized API by creating the necessary database table.
 */
export async function handshakeAuthorizedApis(): Promise<boolean> {
    return getAllAuthorizedApi().then(async (apis: AuthorizedApi[]) => {
        for (const api of apis) {
            let token: string = await generateApiToken(config.token_length);
            let timestamp: number = Date.now();

            const params = Buffer.from(`${api.api_name}.${token}.${timestamp}`).toString("base64");
            let url: URL = new URL(api.api_url + `?params=${params}`);

            http.get(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${config.handshake_static_token}`
                }
            }, (res: http.IncomingMessage) => {
                if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
                    api.api_privatetoken = token;
                    api.api_lastaccess = timestamp;
                    updateAuthorizedApi(api).then(() => {
                        logger.success(`Handshake with ${api.api_name} successful.`);
                    });
                } else {
                    logger.error(`Handshake with ${api.api_name} failed with status code : ${res.statusCode} - ${res.statusMessage}`);
                }
            });
        }

        return true;
    }).catch((err: Error) => {
        throw err;
    });
}