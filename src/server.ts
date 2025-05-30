import app from './app';
import config from './config/config';
import http from 'http';
import * as logger from './utils/logger';



/*==================*/
/* Écoute du server */
/*==================*/
const server = http.createServer(app);

try {
    server.listen(config.app_port, () => {
        logger.success("Server running at PORT :", config.app_port, "!");
        logger.success("Server running at URL :", config.app_url, "!");
        logger.success("Server documentation running at URL :", config.app_url + ":" + config.app_port + "/api-docs", "!");
    }).on("error", (error) => {
        logger.error("FAILED STARTING SERVER\n");
        throw new Error(error.message);
    });
} catch (error) {
    logger.error("Error in main index.ts :", error);
    process.exit(1);
}