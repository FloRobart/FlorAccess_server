import app from './app';
import AppConfig from './config/AppConfig';
import http from 'http';
import * as logger from './core/utils/logger';



/*==================*/
/* Écoute du server */
/*==================*/
try {
    const server = http.createServer(app);

    server.listen(AppConfig.app_port, AppConfig.host_name, () => {
        logger.success("Server running at URL :", AppConfig.base_url, "!");
        logger.success("Server documentation running at URL :", AppConfig.base_url + "/api-docs", "!");
        logger.success("Server running at HOST :", AppConfig.host_name, "!");
        logger.success("Server running at PORT :", AppConfig.app_port, "!");
    }).on("error", (error) => {
        logger.error("FAILED STARTING SERVER\n");
        throw new Error(error.message);
    });
} catch (error) {
    logger.error("Error in server.ts :", error);
    process.exit(1);
}