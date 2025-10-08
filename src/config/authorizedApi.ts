import { createAuthorizedApi } from '../modules/handshakes/authorizedApi.repository';
import config from '../config/config';
import * as logger from '../core/utils/logger';



/**
 * Saves authorized APIs to the database.
 * @param apis An array of authorized API objects to save.
 * @returns A promise that resolves when all APIs are saved successfully.
 */
export async function saveDefaultAuthorizedApisToDatabase(): Promise<boolean> {
    const defaultApis = config.default_authorized_apis;

    for (const api of defaultApis) {
        try {
            if (!api.api_name || !api.api_url) {
                logger.warning("Invalid API configuration :", api);
            }

            createAuthorizedApi(api, true).then(() => {
                logger.success("Authorized API saved successfully :", api);
            }).catch((err) => {
                logger.error("Error saving authorized API :", api, err);
            });
        } catch (err) {
            logger.error("Error processing authorized API :", api, err);
            return false;
        }
    }

    return true;
}
