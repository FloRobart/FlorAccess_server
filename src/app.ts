import express from 'express';
import tokenRoutes from './routes/tokenRoutes';
import userRoutes from './routes/userRoutes';
import passwordRoutes from './routes/passwordRoutes';
import { errorHandler } from './middlewares/errorHandler';
import * as logger from './utils/logger';
import fs from 'node:fs';
import config from './config/config';
import { connectToDatabase } from './database/database';
import { limiter } from './middlewares/rateLimiter';
import handshakeRoutes from './routes/handshakeRoutes';
import { handshakeAuthorizedApis } from './services/handshakeAutorizedApis.service';
import { saveDefaultAuthorizedApisToDatabase } from './config/authorizedApi';
import codeRoutes from './routes/codeRoutes';
import jwtRoutes from './routes/jwtRoutes';
import cors from 'cors';
import { ENABLE_ENV } from './config/enableenv';
import { defaultRouteHandler } from './middlewares/defaultRouteHandler';



const app = express();



/* Database */
connectToDatabase(config.db_uri).then(() => {
    logger.success("Connected to database successfully");
}).catch((err) => {
    logger.error(err);
    process.exit(1); // Exit the application if an error occurs
});


/* Routes and Middleware */
app.use(limiter);
app.use(express.json());

app.get('/', (_req, res) => { res.status(200).send('HEALTH CHECK') });

app.use('/handshake', handshakeRoutes);

app.use('/code', cors(config.corsOptions), codeRoutes);
app.use('/user', cors(config.corsOptions), userRoutes);
app.use('/token', cors(config.corsOptions), tokenRoutes);
app.use('/password', cors(config.corsOptions), passwordRoutes);

app.use('/jwt', cors(config.corsOptions), jwtRoutes);

app.use(defaultRouteHandler);
app.use(errorHandler);



/* Authorized APIs Handshake */
if (config.handshake_authorized_api) {
    /* initialize default authorized APIs */
    saveDefaultAuthorizedApisToDatabase().then((result) => {
        if (result) {
            /* Handshake to other services */
            handshakeAuthorizedApis().then(() => {
                logger.info("Handshake with authorized APIs completed.");
            }).catch((err: Error) => {
                logger.error("Handshake with authorized APIs completed :", err.message);
            });
        }
    });
}



/* Swagger - only in development */
if (ENABLE_ENV[config.app_env] === 5) {
    /* Swagger setup */
    const SWAGGER_JSON_PATH = `${__dirname}/swagger/swagger.json`;
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
        apis: [`${__dirname}/routes/*.ts`, `${__dirname}/swagger/*.ts`],
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    app.get('/api-docs.json', (req, res) => {
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



export default app;