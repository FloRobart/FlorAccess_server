import dotenv from 'dotenv';

dotenv.config();

interface Config {
  app_port: number;
  app_env: string;
  app_name: string;
  app_url: string;
}

const config: Config = {
  app_port: Number(process.env.PORT) || 3000,
  app_env: process.env.APP_ENV || 'default',
  app_name: process.env.APP_NAME || 'Éconoris',
  app_url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
};


export default config;
