import dotenv from 'dotenv';
import fs from 'node:fs';
import { type StringValue } from 'ms';
import ms from 'ms';



dotenv.config();



/* 32 hexadecimal characters are 128 random bits: a shorter token could be guessed */
const MINIMUM_TOKEN_LENGTH = 32;
const DEFAULT_TOKEN_LENGTH = 512;

/* Below the 500 recipients per day of a Gmail account, so that the account is never blocked */
const EMAIL_DAILY_LIMIT: number = Math.round(Number(process.env.EMAIL_DAILY_LIMIT)) || 400;



/**
 * Reads a secret from the file named by the variable <name>_FILE, otherwise from the variable <name>.
 * Production uses a file, so that the secret does not appear in "docker inspect".
 * A file that cannot be read stops the application: it must not start without its secrets.
 * Without file, the value is exactly the one of the variable, so the default values stay the same as before.
 * @param name The name of the variable holding the secret in development
 * @returns The value of the secret, or undefined if neither the file nor the variable is set
 */
function readSecret(name: string): string | undefined {
    const secretFile = process.env[`${name}_FILE`];
    if (!secretFile) { return process.env[name]; }

    return fs.readFileSync(secretFile, 'utf8').trim();
}


/**
 * Reads a secret without which the application must not run, like readSecret.
 * There is no default value: a key known in advance would let anyone forge valid JWT,
 * so the application refuses to start instead.
 * @param name The name of the variable holding the secret in development
 * @returns The value of the secret
 * @throws Error if neither the file nor the variable gives a value
 */
function readRequiredSecret(name: string): string {
    const secret = readSecret(name);
    if (!secret) { throw new Error(`${name} or ${name}_FILE must be set`); }

    return secret;
}



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


/**
 * Reads the length of the random tokens (login requests, links of the verification and login block emails).
 * The length is written in hexadecimal characters, and each random byte gives two of them.
 * A length below the minimum stops the application: a value kept from an old configuration
 * must not silently weaken every link sent by email.
 * @param rawTokenLength Length as written in the environment, in hexadecimal characters
 * @returns Number of random bytes of a token
 * @throws Error if the length is below the minimum
 */
function readTokenLengthInBytes(rawTokenLength: string | undefined): number {
    const tokenLength: number = Math.round(Number(rawTokenLength)) || DEFAULT_TOKEN_LENGTH;
    if (tokenLength < MINIMUM_TOKEN_LENGTH) {
        throw new Error(`TOKEN_LENGTH must be at least ${MINIMUM_TOKEN_LENGTH}`);
    }

    return Math.ceil(tokenLength / 2);
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
    readonly email_daily_limit: number;
    readonly email_reserved_for_users: number;
    readonly new_account_daily_limit: number;

    /* Security */
    readonly hash_rounds: number;
    readonly token_length: number;
    readonly token_expiration: number;

    /* Authentication */
    readonly default_auth_method: string;
    readonly code_data_set: string;
    readonly login_code_max_attempts: number;
    readonly login_request_cooldown: number;
    readonly login_request_extended_cooldown: number;
    readonly login_block_duration: number;

    /* Rate Limiting */
    readonly request_limit_per_second: number;
    readonly request_limit_time: number;
    readonly auth_request_limit: number;
    readonly auth_request_limit_time: number;
    readonly email_request_limit: number;
    readonly email_request_limit_time: number;

    /* CORS */
    readonly corsOptions: {
        origin: string[];
        methods: string[];
        allowedHeaders: string[];
    };
}

const AppConfig: AppConfigInterface = {
    /* Application configuration */
    app_name: "Floraccess",
    app_port: 80,
    host_name: process.env.HOST_NAME || 'localhost',
    base_url: process.env.BASE_URL || 'http://localhost:80',
    /* Production by default: a forgotten variable must not log the login codes instead of sending them, nor expose Swagger */
    app_env: process.env.APP_ENV?.toLowerCase() || 'prod',
    log_format: process.env.LOG_FORMAT || 'combined',

    /* Database */
    db_uri: `${process.env.DB_SCHEME}://${process.env.DB_USER}:${readSecret('DB_PASSWORD')}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`,

    /* Email */
    mail_service: process.env.MAIL_SERVICE || 'gmail',
    mail_username: process.env.MAIL_USERNAME || '',
    mail_password: readSecret('MAIL_PASSWORD') || '',
    email_daily_limit: EMAIL_DAILY_LIMIT,
    /* A quarter of the daily limit by default: the emails of the administrators can never use it, it stays for the login codes */
    email_reserved_for_users: Math.round(Number(process.env.EMAIL_RESERVED_FOR_USERS)) || Math.round(EMAIL_DAILY_LIMIT / 4),
    new_account_daily_limit: Math.round(Number(process.env.NEW_ACCOUNT_DAILY_LIMIT)) || 100,

    /* JWT */
    jwt_signing_key: readRequiredSecret('JWT_SIGNING_KEY'),
    jwt_expiration: (ms((process.env.JWT_EXPIRATION as StringValue) || "1d") || (1 * 24 * 60 * 60 * 1000)) / 1000,
    session_max_duration: (ms((process.env.SESSION_MAX_DURATION as StringValue) || "90d") || (90 * 24 * 60 * 60 * 1000)),

    /* Security */
    hash_rounds: Math.round(Number(process.env.HASH_ROUNDS)) || 10,
    token_length: readTokenLengthInBytes(process.env.TOKEN_LENGTH),
    token_expiration: parseDurationToMilliseconds(process.env.TOKEN_EXPIRATION, 30 * 60 * 1000),

    /* Authentication */
    default_auth_method: process.env.DEFAULT_AUTH_METHOD || 'EMAIL_CODE',
    code_data_set: process.env.CODE_DATA_SET || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    login_code_max_attempts: Math.round(Number(process.env.LOGIN_CODE_MAX_ATTEMPTS)) || 5,
    login_request_cooldown: parseDurationToMilliseconds(process.env.LOGIN_REQUEST_COOLDOWN, 60 * 1000),
    login_request_extended_cooldown: parseDurationToMilliseconds(process.env.LOGIN_REQUEST_EXTENDED_COOLDOWN, 10 * 60 * 1000),
    /* Used by the block link of the login code emails, and by the block after too many codes sent without a successful login */
    login_block_duration: parseDurationToMilliseconds(process.env.LOGIN_BLOCK_DURATION, 24 * 60 * 60 * 1000),

    /* Rate Limiting */
    request_limit_per_second: Math.round(Number(process.env.REQUEST_LIMIT_PER_SECOND)) || 10,
    request_limit_time: (ms((process.env.REQUEST_LIMIT_TIME as StringValue) || "30min") || (30 * 60 * 1000)),
    auth_request_limit: Math.round(Number(process.env.AUTH_REQUEST_LIMIT)) || 120,
    auth_request_limit_time: (ms((process.env.AUTH_REQUEST_LIMIT_TIME as StringValue) || "1h") || (60 * 60 * 1000)),
    email_request_limit: Math.round(Number(process.env.EMAIL_REQUEST_LIMIT)) || 12,
    email_request_limit_time: parseDurationToMilliseconds(process.env.EMAIL_REQUEST_LIMIT_TIME, 60 * 60 * 1000),

    /* CORS */
    /* No credentials: the clients send their JWT in the Authorization header, never in a cookie */
    corsOptions: {
        origin: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
};



export default AppConfig;
