import express from 'express';
import { Request, Response, NextFunction } from 'express';
import userRoutes from './modules/users/users.routes';
import { errorHandler } from './core/middlewares/errorHandler';
import * as logger from './core/utils/logger';
import fs from 'node:fs';
import config from './config/config';
import { Database } from './core/database/database';
import { limiter } from './core/middlewares/rateLimiter';
import cors from 'cors';
import { defaultRouteHandler } from './core/middlewares/defaultRouteHandler';
import path from 'node:path';



const app = express();


(async () => {
    /* Database */
    try {
        const database = new Database(config.db_uri);
        await database.connect();
        logger.success("Connected to database successfully");
    } catch (error) {
        logger.error("Failed to connect to database :", error);
        process.exit(1);
    }


    /* Routes and Middleware */
    app.use(cors(config.corsOptions));
    if (config.app_env.includes('prod')) {
        app.set('trust proxy', true);
    }
    app.use(limiter);
    app.use(express.json());

    app.get('/', (_req, res) => { res.status(200).send('HEALTH CHECK') });
    app.get("/favicon.ico", (_req, res) => {
        res.sendFile(path.join(__dirname, "../public/favicon.ico"));
    });

    app.use(async (req: Request, _res: Response, next: NextFunction) => {
        logger.info(`Incoming request`, { ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, method: req.method, url: req.url });
        next();
    });


    app.use('/users', userRoutes);


    /* Swagger - only in development */
    if (config.app_env.includes('dev')) {
        /* Swagger setup */
        const SWAGGER_JSON_PATH = `${__dirname}/swagger/json/swagger.json`;
        const swaggerUi = require('swagger-ui-express');
        const swaggerJsDoc = require('swagger-jsdoc');
        const swaggerOptions = {
            swaggerDefinition: {
                openapi: '3.0.0',
                info: {
                    title: `${config.app_name} API`,
                    version: '2.0.0',
                    description: 'API documentation',
                },
                servers: [
                    {
                        url: config.base_url,
                    },
                ],
            },
            apis: [`${__dirname}/modules/**/*.ts`, `${__dirname}/swagger/**/*.ts`, `${__dirname}/modules/**/*.js`, `${__dirname}/swagger/**/*.js`],
        };

        const swaggerDocs = swaggerJsDoc(swaggerOptions);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        app.get('/api-docs.json', (_req, res) => {
            if (!app.locals.swaggerJsonFileCreated) {
                res.status(500).json({ error: "The Swagger JSON file encountered a problem creating it. Please see : " + config.base_url + "/api-docs" });
                return;
            }
            return res.download(SWAGGER_JSON_PATH)
        });


        /* Create swagger json file */
        try {
            fs.writeFileSync(SWAGGER_JSON_PATH, Buffer.from(JSON.stringify(swaggerDocs), 'utf8'));
            app.locals.swaggerJsonFileCreated = true;
            logger.success("Swagger JSON file created at :", SWAGGER_JSON_PATH);
        } catch (err) {
            logger.error(err);
            app.locals.swaggerJsonFileCreated = false;
            logger.error("Error creating swagger JSON file at :", SWAGGER_JSON_PATH);
        }
    }


    app.use(defaultRouteHandler);
    app.use(errorHandler);
})();



export default app;