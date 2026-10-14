import dotenv from 'dotenv';
import { type StringValue } from 'ms';
import ms from 'ms';



dotenv.config();



/**
 * Converts a duration read from the environment into milliseconds.
 * A number without unit is read as seconds, any other value ("30min", "1h") is read by the ms library.
 * @param rawDuration Duration as written in the environment
 * @param defaultDurationInMilliseconds Duration used when the environment value is missing or invalid
 * @returns Duration in milliseconds
 */
function parseDurationToMilliseconds(rawDuration: string | undefined, defaultDurationInMilliseconds: number): number {
    const duration = rawDuration?.trim();
    if (!duration) { return defaultDurationInMilliseconds; }

    const isNumberWithoutUnit = /^\d+$/.test(duration);
    if (isNumberWithoutUnit) { return Number(duration) * 1000; }

    return ms(duration as StringValue) || defaultDurationInMilliseconds;
}



interface AppConfigInterface {
    /* Application configuration */
    readonly app_name: string;
    readonly app_port: number;
    readonly host_name: string;
    readonly base_url: string;
    readonly app_env: string;
    readonly log_format: string;

    /* Database */
    readonly db_uri: string;

    /* JWT */
    readonly jwt_signing_key: string;
    readonly jwt_expiration: number;
    readonly session_max_duration: number;

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
    readonly login_code_max_attempts: number;
    readonly login_request_cooldown: number;
    readonly login_block_duration: number;

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

const AppConfig: AppConfigInterface = {
    /* Application configuration */
    app_name: "Floraccess",
    app_port: 80,
    host_name: process.env.HOST_NAME || 'localhost',
    base_url: process.env.BASE_URL || 'http://localhost:80',
    app_env: process.env.APP_ENV?.toLowerCase() || 'dev',
    log_format: process.env.LOG_FORMAT || 'combined',

    /* Database */
    db_uri: `${process.env.DB_SCHEME}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`,

    /* Email */
    mail_service: process.env.MAIL_SERVICE || 'gmail',
    mail_username: process.env.MAIL_USERNAME || '',
    mail_password: process.env.MAIL_PASSWORD || '',

    /* JWT */
    jwt_signing_key: process.env.JWT_SIGNING_KEY || 'ABCD',
    jwt_expiration: (ms((process.env.JWT_EXPIRATION as StringValue) || "1d") || (1 * 24 * 60 * 60 * 1000)) / 1000,
    session_max_duration: (ms((process.env.SESSION_MAX_DURATION as StringValue) || "90d") || (90 * 24 * 60 * 60 * 1000)),

    /* Security */
    hash_rounds: Math.round(Number(process.env.HASH_ROUNDS)) || 10,
    token_length: (Math.round(Number(process.env.TOKEN_LENGTH)) / 2) || (512/2),
    token_expiration: parseDurationToMilliseconds(process.env.TOKEN_EXPIRATION, 30 * 60 * 1000),

    /* Authentication */
    default_auth_method: process.env.DEFAULT_AUTH_METHOD || 'EMAIL_CODE',
    code_data_set: process.env.CODE_DATA_SET || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    login_code_max_attempts: Math.round(Number(process.env.LOGIN_CODE_MAX_ATTEMPTS)) || 5,
    login_request_cooldown: parseDurationToMilliseconds(process.env.LOGIN_REQUEST_COOLDOWN, 60 * 1000),
    login_block_duration: parseDurationToMilliseconds(process.env.LOGIN_BLOCK_DURATION, 24 * 60 * 60 * 1000),

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



export default AppConfig;
