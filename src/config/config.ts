import dotenv from 'dotenv';
dotenv.config();



interface Config {
  app_port: number;
  app_env: string;
  app_name: string;
  app_url: string;
  mail_service?: string;
  mail_username?: string;
  mail_password?: string;
  db_uri: string;
}

const config: Config = {
  app_port: Number(process.env.PORT) || 3000,
  app_env: process.env.APP_ENV || 'default',
  app_name: process.env.APP_NAME || 'Éconoris',
  app_url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
  mail_service: process.env.MAIL_SERVICE || 'gmail',
  mail_username: process.env.MAIL_USERNAME,
  mail_password: process.env.MAIL_PASSWORD,
  db_uri: process.env.DB_URI || "postgresql://postgres:postgres@localhost:5432/postgres",
};


export default config;
