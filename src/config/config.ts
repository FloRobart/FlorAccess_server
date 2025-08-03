import dotenv from 'dotenv';
dotenv.config();



interface Config {
    base_url: string;
    app_port: number;
    host_name: string;
    app_env: string;
    app_name: string;
    mail_service: string;
    mail_username?: string;
    mail_password?: string;
    token_length: number;
    token_expiration: number;
    db_uri: string;
    request_limit_per_second: number;
    request_limit_time: number;
    jwt_signing_key: string;
    jwt_encryption_key: string;
    jwt_expiration: number;
}


const config: Config = {
    base_url: process.env.BASE_URL || 'http://localhost',
    app_port: Math.round(Number(process.env.PORT)) || 3000,
    host_name: process.env.HOST_NAME || 'localhost',
    app_env: process.env.APP_ENV || 'default',
    app_name: process.env.APP_NAME || 'Éconoris',
    mail_service: process.env.MAIL_SERVICE || 'gmail',
    mail_username: process.env.MAIL_USERNAME,
    mail_password: process.env.MAIL_PASSWORD,
    token_length: Math.round(Number(process.env.TOKEN_LENGTH)) || 128,
    token_expiration: Math.round(Number(process.env.TOKEN_EXPIRATION)) || 3600,
    db_uri: process.env.DB_URI || "postgresql://postgres:postgres@localhost:5432/postgres",
    request_limit_per_second: Math.round(Number(process.env.REQUEST_LIMIT_PER_SECOND)) || 1,
    request_limit_time: Math.round(Number(process.env.REQUEST_LIMIT_TIME)) || 900,
    jwt_signing_key: process.env.JWT_SIGNING_KEY || 'your_jwt_signing_key',
    jwt_encryption_key: process.env.JWT_ENCRYPTION_KEY || 'your_jwt_encryption_key',
    jwt_expiration: process.env.JWT_EXPIRATION ? Number(process.env.JWT_EXPIRATION) : 3600, // Default to 1 hour
};



export default config;
