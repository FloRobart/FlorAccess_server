import express from 'express';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middlewares/errorHandler';
import * as logger from './utils/logger';
import fs from 'node:fs';
import config from './config/config';



const app = express();



/* Swagger setup */
const SWAGGER_JSON_PATH = `${__dirname}/swagger/swagger.json`;
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Floraccess API',
            version: '2.0.0',
            description: 'API documentation',
        },
        servers: [
            {
                url: config.app_url + ":" + config.app_port,
            },
        ],
    },
    apis: [`${__dirname}/routes/*.ts`, `${__dirname}/swagger/*.ts`], // files containing annotations as above
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get('/api-docs.json', (req, res) => {
    if (!app.locals.swaggerJsonFileCreated) {
        res.status(500).json({ error: "The Swagger JSON file encountered a problem creating it. Please see : " + config.app_url + ":" + config.app_port + "/api-docs" });
        return;
    }
    return res.download(SWAGGER_JSON_PATH)
});


/* Database */
// TODO : Implement database connection


/* Routes */
app.use(express.json());

app.use('/', authRoutes);

app.use(errorHandler);


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

export default app;