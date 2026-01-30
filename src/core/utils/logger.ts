import AppConfig from '../../config/AppConfig';
import { sendErrorEmail } from '../email/error.email';



/**
 * Logger class encapsulant les méthodes de log.
 */
class Logger {
    private getTimestamp(): string {
        return new Date().toISOString();
    }

    private prefix(level: string): string {
        return ` ${level} ${AppConfig.app_name} - ${this.getTimestamp()} |`;
    }

    error(...args: any[]) {
        if (!AppConfig.app_env.includes('silent')) {
            console.error(this.prefix('[❌]'), ...args);

            if (AppConfig.app_env.includes('prod')) {
                sendErrorEmail(...args).then(() => {
                    this.success('Error email sent successfully !');
                }).catch((err: Error) => {
                    console.error(this.prefix('[❌]'), 'Failed to send error email :', err);
                });
            }
        }
    }

    warning(...args: any[]) {
        if (!AppConfig.app_env.includes('silent')) {
            console.warn(this.prefix('[⚠️]'), ...args);
        }
    }

    success(...args: any[]) {
        if (!AppConfig.app_env.includes('silent')) {
            console.log(this.prefix('[✅]'), ...args);
        }
    }

    info(...args: any[]) {
        if (!AppConfig.app_env.includes('silent')) {
            console.info(this.prefix('[❕]'), ...args);
        }
    }

    debug(...args: any[]) {
        if (!AppConfig.app_env.includes('silent') && AppConfig.app_env.includes('dev')) {
            console.debug(this.prefix('[🐛]'), ...args);
        }
    }
}



const logger = new Logger();
export default logger;
