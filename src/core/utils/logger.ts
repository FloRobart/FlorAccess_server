import AppConfig from '../../config/AppConfig';
import { sendErrorEmail } from '../email/error.email';



const errorMessage   = ` [❌] ${AppConfig.app_name} - ${new Date().toISOString()} |`;
const warningMessage = ` [⚠️] ${AppConfig.app_name} - ${new Date().toISOString()} |`;
const successMessage = ` [✅] ${AppConfig.app_name} - ${new Date().toISOString()} |`;
const infoMessage    = ` [❕] ${AppConfig.app_name} - ${new Date().toISOString()} |`;
const debugMessage   = ` [🐛] ${AppConfig.app_name} - ${new Date().toISOString()} |`;



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
    if (!AppConfig.app_env.includes('silent')) {
        console.error(errorMessage, ...args);

        if (AppConfig.app_env.includes('prod')) {
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
    if (!AppConfig.app_env.includes('silent')) {
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
    if (!AppConfig.app_env.includes('silent')) {
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
    if (!AppConfig.app_env.includes('silent')) {
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
    if (!AppConfig.app_env.includes('silent') && AppConfig.app_env.includes('dev')) {
        console.debug(debugMessage, ...args);
    }
}
