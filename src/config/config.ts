import dotenv from 'dotenv';
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

    /* Authentication */
    readonly default_auth_method: string;
    readonly code_data_set: string;

    /* Rate Limiting */
    readonly request_limit_per_second: number;
    readonly request_limit_time: number;

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
    app_name: "Floraccess",
    app_port: 80,
    host_name: process.env.HOST_NAME || 'localhost',
    base_url: process.env.BASE_URL || 'http://localhost:80',
    app_env: process.env.APP_ENV?.toLocaleLowerCase() || 'dev',

    /* Database */
    db_uri: `${process.env.DB_SCHEME}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`,

    /* Email */
    mail_service: process.env.MAIL_SERVICE || 'gmail',
    mail_username: process.env.MAIL_USERNAME || '',
    mail_password: process.env.MAIL_PASSWORD || '',

    /* JWT */
    jwt_signing_key: process.env.JWT_SIGNING_KEY || 'ABCD',
    jwt_expiration: ms((process.env.JWT_EXPIRATION as StringValue) || "1d") || (1 * 24 * 60 * 60 * 1000),

    /* Security */
    hash_rounds: Math.round(Number(process.env.HASH_ROUNDS)) || 10,
    token_length: Math.round(Number(process.env.TOKEN_LENGTH)) || 64,
    token_expiration: (ms((process.env.TOKEN_EXPIRATION as StringValue) || "30min") || (30 * 60 * 1000)),

    /* Authentication */
    default_auth_method: process.env.DEFAULT_AUTH_METHOD || 'EMAIL_CODE',
    code_data_set: process.env.CODE_DATA_SET || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',

    /* Rate Limiting */
    request_limit_per_second: Math.round(Number(process.env.REQUEST_LIMIT_PER_SECOND)) || 10,
    request_limit_time: (ms((process.env.REQUEST_LIMIT_TIME as StringValue) || "30min") || (30 * 60 * 1000)),

    /* CORS */
    corsOptions: {
        origin: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
};



export default config;