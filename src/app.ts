import express from 'express';
import { Request, Response, NextFunction } from 'express';
import userRoutes from './modules/users/users.routes';
import { errorHandler } from './core/middlewares/error.middleware';
import * as logger from './core/utils/logger';
import fs from 'node:fs';
import AppConfig from './config/AppConfig';
import { Database } from './core/models/Database.model';
import { limiter } from './core/middlewares/rate_limiter.middleware';
import cors from 'cors';
import { defaultRouteHandler } from './core/middlewares/default_route.middleware';
import path from 'node:path';
import helmet from 'helmet';
import { helmetOptions } from './core/middlewares/helmetHttpHeaders.middleware';



const app = express();


(async () => {
    /*----------*/
    /* Database */
    /*----------*/
    try {
        const database = new Database(AppConfig.db_uri);
        await database.connect();
        logger.success("Connected to database successfully");
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }


    /*-----------------------*/
    /* Routes and Middleware */
    /*-----------------------*/
    /* Cross Origin Resource Sharing (CORS) */
    app.use(cors(AppConfig.corsOptions));

    /* Security headers (Helmet) */
    app.use(helmet(helmetOptions));

    /* Trust proxy in production */
    if (AppConfig.app_env.includes('prod')) {
        app.set('trust proxy', true);
    }

    /* Rate Limiter */
    app.use(limiter);

    /* Body parser */
    app.use(express.json());

    /* Health Check */
    app.get('/', (_req, res) => { res.status(200).send('HEALTH CHECK') });

    /* Favicon */
    app.get("/favicon.ico", (_req, res) => {
        res.sendFile(path.join(__dirname, "../public/favicon.ico"));
    });

    /* Logger */
    app.use(async (req: Request, _res: Response, next: NextFunction) => {
        logger.info(`Incoming request`, { ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, method: req.method, url: req.url });
        next();
    });


    /* Users routes */
    app.use('/users', userRoutes);


    /* Swagger - only in development */
    if (AppConfig.app_env.includes('dev')) {
        /* Swagger setup */
        const SWAGGER_JSON_PATH = `${__dirname}/swagger/json/swagger.json`;
        const swaggerUi = require('swagger-ui-express');
        const swaggerJsDoc = require('swagger-jsdoc');
        const swaggerOptions = {
            swaggerDefinition: {
                openapi: '3.0.0',
                info: {
                    title: `${AppConfig.app_name} API`,
                    version: '2.0.0',
                    description: 'API documentation',
                },
                servers: [
                    {
                        url: AppConfig.base_url,
                    },
                ],
            },
            apis: [`${__dirname}/modules/**/*.ts`, `${__dirname}/swagger/**/*.ts`, `${__dirname}/modules/**/*.js`, `${__dirname}/swagger/**/*.js`],
        };

        const swaggerDocs = swaggerJsDoc(swaggerOptions);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        app.get('/api-docs.json', (_req, res) => {
            if (!app.locals.swaggerJsonFileCreated) {
                res.status(500).json({ error: "The Swagger JSON file encountered a problem creating it. Please see : " + AppConfig.base_url + "/api-docs" });
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

    /* Default Route Handler (404) */
    app.use(defaultRouteHandler);

    /* Error Handler */
    app.use(errorHandler);
})();



export default app;