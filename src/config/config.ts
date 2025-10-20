import dotenv from 'dotenv';
import { AuthorizedApi } from '../modules/handshakes/AuthorizedApi.schema';
import { type StringValue } from 'ms';
import ms from 'ms';


dotenv.config();



interface Config {
    /* Application configuration */
    readonly app_name: string;
    readonly app_port: number;
    readonly host_name: string;
    readonly base_url: string;
    readonly app_env: string;

    /* Database */
    readonly db_uri: string;

    /* JWT */
    readonly jwt_signing_key: string;
    readonly jwt_expiration: number;

    /* Email */
    readonly mail_service: string;
    readonly mail_username: string;
    readonly mail_password: string;

    /* Security */
    readonly hash_rounds: number;
    readonly token_length: number;
    readonly token_expiration: number;
    readonly request_limit_per_second: number;
    readonly request_limit_time: number;
    readonly hash_algorithm: string;
    readonly default_auth_method: string;
    readonly code_data_set: string;

    /* Handshake authorized API */
    readonly handshake_static_token: string;
    readonly handshake_authorized_api: boolean;

    /* Default Authorized APIs */
    readonly default_authorized_apis: AuthorizedApi[];

    /* CORS */
    readonly corsOptions: {
        origin: string[];
        methods: string[];
        credentials: boolean;
        allowedHeaders: string[];
    };
}

const config: Config = {
    /* Application configuration */
    app_name: process.env.APP_NAME || 'Floraccess',
    app_port: 80,
    host_name: process.env.HOST_NAME || 'localhost',
    base_url: process.env.BASE_URL || 'http://localhost',
    app_env: process.env.APP_ENV || 'default',

    /* Database */
    db_uri: `${process.env.DB_SCHEME}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`,

    /* JWT */
    jwt_signing_key: process.env.JWT_SIGNING_KEY || '',
    jwt_expiration: ms((process.env.JWT_EXPIRATION as StringValue) || "1d"),

    /* Email */
    mail_service: process.env.MAIL_SERVICE || 'gmail',
    mail_username: process.env.MAIL_USERNAME || '',
    mail_password: process.env.MAIL_PASSWORD || '',

    /* Security */
    hash_rounds: Math.round(Number(process.env.HASH_ROUNDS)) || 10,
    token_length: Math.round(Number(process.env.TOKEN_LENGTH)) || 128,
    token_expiration: Math.round(Number(process.env.TOKEN_EXPIRATION)) || 3600,
    request_limit_per_second: Math.round(Number(process.env.REQUEST_LIMIT_PER_SECOND)) || 1,
    request_limit_time: Math.round(Number(process.env.REQUEST_LIMIT_TIME)) || 900,
    hash_algorithm: process.env.HASH_ALGORITHM || 'sha256',
    default_auth_method: process.env.DEFAULT_AUTH_METHOD || 'EMAIL_CODE',
    code_data_set: process.env.CODE_DATA_SET || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',

    /* Handshake authorized API */
    handshake_static_token: process.env.HANDSHAKE_STATIC_TOKEN || '',
    handshake_authorized_api: process.env.HANDSHAKE_AUTHORIZED_API === 'true',

    /* Default Authorized APIs */
    default_authorized_apis: parseDefaultAuthorizedApis(process.env.DEFAULT_AUTHORIZED_APIS || '[]'),

    /* CORS */
    corsOptions: {
        origin: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
};


/**
 * Parses the JSON string of default authorized APIs.
 * @param default_authorized_apis JSON string of default authorized APIs
 * @returns Array of default authorized APIs
 */
function parseDefaultAuthorizedApis(default_authorized_apis: string): AuthorizedApi[] {
    try {
        const parsed: AuthorizedApi[] = JSON.parse(default_authorized_apis);
        if (Array.isArray(parsed)) {
            return parsed.map(api => ({
                api_name: api.api_name || '',
                api_url: api.api_url || ''
            }));
        }
    } catch (error) {
        console.error("Error parsing DEFAULT_AUTHORIZED_APIS :", error);
    }
    return [];
}



export default config;
