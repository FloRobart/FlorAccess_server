import config from '../config/config';


const ENABLE_ENV: Record<string, number> = {
    "default": 5,

    "developpement": 5,
    "dev": 5,
    "debug": 5,
    "local": 5,
    "local-dev": 5,
    "verbose": 5,

    "production": 4,
    "prod": 4,
    "info": 4,

    "success": 3,

    "warn": 2,
    "warning": 2,

    "error": 1,
    "error-only": 1,

    "none": 0,
    "silent": 0,
    "off": 0,
    "disable": 0,
};

const errorMessage   = ` [❌] ${config.app_name} - ERROR   |`;
const warningMessage = ` [⚠️] ${config.app_name} - WARNING |`;
const successMessage = ` [✅] ${config.app_name} - SUCCESS |`;
const infoMessage    = ` [❕] ${config.app_name} - INFO    |`;
const debugMessage   = ` [🐛] ${config.app_name} - DEBUG   |`;


/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, warning and error logs will be displayed.
 * - If APP_ENV is 3, success, warning and error logs will be displayed.
 * - If APP_ENV is 4, info, success, warning and error logs will be displayed.
 * - If APP_ENV is 5, debug, info, success, warning and error logs will be displayed.
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
 * - If APP_ENV is 2, warning and error logs will be displayed.
 * - If APP_ENV is 3, success, warning and error logs will be displayed.
 * - If APP_ENV is 4, info, success, warning and error logs will be displayed.
 * - If APP_ENV is 5, debug, info, success, warning and error logs will be displayed.
 * @param args elements to log
 */
export function warning(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 2) {
        console.warn(warningMessage, ...args);
    }
}

/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, warning and error logs will be displayed.
 * - If APP_ENV is 3, success, warning and error logs will be displayed.
 * - If APP_ENV is 4, info, success, warning and error logs will be displayed.
 * - If APP_ENV is 5, debug, info, success, warning and error logs will be displayed.
 * @param args elements to log
 */
export function success(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 3) {
        console.log(successMessage, ...args);
    }
}

/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, warning and error logs will be displayed.
 * - If APP_ENV is 3, success, warning and error logs will be displayed.
 * - If APP_ENV is 4, info, success, warning and error logs will be displayed.
 * - If APP_ENV is 5, debug, info, success, warning and error logs will be displayed.
 * @param args elements to log
 */
export function info(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 4) {
        console.info(infoMessage, ...args);
    }
}

/**
 * Logger function to log messages based on the environment level.
 * @description
 * - If APP_ENV is 0, no logs will be displayed.
 * - If APP_ENV is 1, only error logs will be displayed.
 * - If APP_ENV is 2, warning and error logs will be displayed.
 * - If APP_ENV is 3, success, warning and error logs will be displayed.
 * - If APP_ENV is 4, info, success, warning and error logs will be displayed.
 * - If APP_ENV is 5, debug, info, success, warning and error logs will be displayed.
 * @param args elements to log
 */
export function debug(...args: any[]) {
    if (ENABLE_ENV[config.app_env] >= 5) {
        console.debug(debugMessage, ...args);
    }
}
