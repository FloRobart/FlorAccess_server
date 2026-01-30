import app from './app';
import AppConfig from './config/AppConfig';
import http from 'http';
import logger from './core/utils/logger';
import { Database } from './core/models/Database.model';



(async () => {
    /*========================*/
    /* Connection to Database */
    /*========================*/
    try {
        const database = new Database(AppConfig.db_uri);
        await database.connect();
        logger.success("Connected to database successfully");
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }


    /*==================*/
    /* Écoute du server */
    /*==================*/
    const server = http.createServer(app);

    server.listen(AppConfig.app_port, AppConfig.host_name, () => {
        logger.success("Server running at PORT :", AppConfig.app_port, "!");
        logger.success("Server running at URL :", AppConfig.base_url, "!");
        logger.success("Server documentation running at URL :", AppConfig.base_url + "/api-docs", "!");
    });

    server.on("error", (error: Error) => {
        logger.error("FAILED STARTING SERVER\n");
        logger.error(error);
        process.exit(1);
    });
})();