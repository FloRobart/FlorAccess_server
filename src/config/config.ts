import dotenv from 'dotenv';
dotenv.config();



interface Config {
    app_port: number;
    app_env: string;
    app_name: string;
    app_url: string;
    mail_service: string;
    mail_username?: string;
    mail_password?: string;
    token_length: number;
    token_expiration: number;
    db_uri: string;
    request_limit_per_second: number;
    request_limit_time: number;
}


const config: Config = {
    app_port: Math.round(Number(process.env.PORT)) || 3000,
    app_env: process.env.APP_ENV || 'default',
    app_name: process.env.APP_NAME || 'Éconoris',
    app_url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
    mail_service: process.env.MAIL_SERVICE || 'gmail',
    mail_username: process.env.MAIL_USERNAME,
    mail_password: process.env.MAIL_PASSWORD,
    token_length: Math.round(Number(process.env.TOKEN_LENGTH)) || 128,
    token_expiration: Math.round(Number(process.env.TOKEN_EXPIRATION)) || 3600,
    db_uri: process.env.DB_URI || "postgresql://postgres:postgres@localhost:5432/postgres",
    request_limit_per_second: Math.round(Number(process.env.REQUEST_LIMIT_PER_SECOND)) || 1,
    request_limit_time: Math.round(Number(process.env.REQUEST_LIMIT_TIME)) || 900
};



export default config;
