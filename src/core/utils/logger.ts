import config from '../../config/config';
import { sendErrorEmail } from '../email/errorEmail';



const errorMessage = ` [❌] ${config.app_name} - ERROR   |`;
const warningMessage = ` [⚠️] ${config.app_name} - WARNING |`;
const successMessage = ` [✅] ${config.app_name} - SUCCESS |`;
const infoMessage = ` [❕] ${config.app_name} - INFO    |`;
const debugMessage = ` [🐛] ${config.app_name} - DEBUG   |`;



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
    if (!config.app_env.includes('silent')) {
        console.error(errorMessage, ...args);

        if (config.app_env.includes('prod')) {
            sendErrorEmail(...args).then(() => {
                success("Error email sent successfully !");
            }).catch((err: Error) => {
                console.error(errorMessage, "Failed to send error email :", err);
            });
        }
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
    if (!config.app_env.includes('silent')) {
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
    if (!config.app_env.includes('silent')) {
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
    if (!config.app_env.includes('silent')) {
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
    if (!config.app_env.includes('silent') && config.app_env.includes('dev')) {
        console.debug(debugMessage, ...args);
    }
}
