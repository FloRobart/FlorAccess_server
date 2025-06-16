import config from '../config/config';


const ENABLE_ENV: Record<string, number> = {
    "default": 4,

    "developpement": 4,
    "dev": 4,
    "debug": 4,
    "local": 4,
    "local-dev": 4,
    "verbose": 4,

    "production": 3,
    "prod": 3,
    "info": 3,

    "success": 2,

    "error": 1,
    "error-only": 1,

    "none": 0,
    "silent": 0,
    "off": 0,
    "disable": 0,
};

const errorMessage = ` [❌] ${config.app_name} - ERROR |`;
const successMessage = ` [✅] ${config.app_name} - SUCCESS |`;
const infoMessage = ` [❕] ${config.app_name} - INFO |`;
const debugMessage = ` [🐛] ${config.app_name} - DEBUG |`;


/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, success and error logs will be displayed.
 * - If APP_ENV is 3, info, success, and error logs will be displayed.
 * - If APP_ENV is 4, debug, info, success, and error logs will be displayed.
 * @param args elements to log
 */
export function error(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 1) {
        console.error(errorMessage, ...args);
    }
}

/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, success and error logs will be displayed.
 * - If APP_ENV is 3, info, success, and error logs will be displayed.
 * - If APP_ENV is 4, debug, info, success, and error logs will be displayed.
 * @param args elements to log
 */
export function success(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 2) {
        console.log(successMessage, ...args);
    }
}

/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, success and error logs will be displayed.
 * - If APP_ENV is 3, info, success, and error logs will be displayed.
 * - If APP_ENV is 4, debug, info, success, and error logs will be displayed.
 * @param args elements to log
 */
export function info(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 3) {
        console.info(infoMessage, ...args);
    }
}

/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, success and error logs will be displayed.
 * - If APP_ENV is 3, info, success, and error logs will be displayed.
 * - If APP_ENV is 4, debug, info, success, and error logs will be displayed.
 * @param args elements to log
 */
export function debug(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 4) {
        console.debug(debugMessage, ...args);
    }
}
