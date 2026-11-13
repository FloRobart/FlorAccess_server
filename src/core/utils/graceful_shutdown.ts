import type { Server } from 'node:http';
import type { IDatabase } from '../models/Database.model';
import logger from './logger';



/* Docker stops the container with SIGTERM, a terminal with SIGINT (Ctrl+C) */
const SHUTDOWN_SIGNALS: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

/* Docker kills the container 10 seconds after SIGTERM: the requests and the cron jobs still running after
   these delays are given up, so that the connections to the database are still closed before */
export const CRON_JOBS_STOP_TIMEOUT_IN_MILLISECONDS = 3000;
export const REQUESTS_END_TIMEOUT_IN_MILLISECONDS = 5000;

const SUCCESS_EXIT_CODE = 0;
const FAILURE_EXIT_CODE = 1;



/**
 * What the server must stop before the process exits.
 */
export type ShutdownResources = {
    server: Server;
    database: IDatabase;
    stopCronJobs: () => Promise<void>;
};



/**
 * Stops the server cleanly when the process is asked to stop (deployment, restart of the container).
 *
 * Without it, Node.js would exit at once: the requests in progress would be cut, such as the confirmation of a login code,
 * and the connections to the database would be left open.
 * A second signal during the shutdown is ignored: the shutdown in progress already ends with the exit of the process.
 * @param resources What the server must stop before the process exits
 */
export function registerGracefulShutdown(resources: ShutdownResources): void {
    let isShuttingDown = false;

    const handleShutdownSignal = async (signal: NodeJS.Signals): Promise<void> => {
        if (isShuttingDown) { return; }
        isShuttingDown = true;

        logger.info(`${signal} received, the server stops`);
        const exitCode: number = await shutDownGracefully(resources);
        process.exit(exitCode);
    };

    for (const signal of SHUTDOWN_SIGNALS) {
        process.on(signal, handleShutdownSignal);
    }
}


/**
 * Stops the server in the order which loses nothing:
 *   1. the cron jobs, so that no job starts during the shutdown, after the end of a job in progress;
 *   2. the HTTP server, which refuses the new connections, then waits for the end of the requests in progress;
 *   3. the connections to the database, once no request nor job can use them anymore.
 * @param resources What the server must stop
 * @returns The exit code of the process: 0 when everything stopped cleanly, 1 otherwise
 */
export async function shutDownGracefully(resources: ShutdownResources): Promise<number> {
    try {
        await resources.stopCronJobs();
        await closeServer(resources.server);
        await resources.database.close();

        logger.success("Server stopped cleanly");
        return SUCCESS_EXIT_CODE;
    } catch (error) {
        logger.error("Failed to stop the server cleanly :", error);
        return FAILURE_EXIT_CODE;
    }
}


/**
 * Closes the HTTP server, and waits for the end of the requests in progress.
 * The requests which last longer than REQUESTS_END_TIMEOUT_IN_MILLISECONDS have their connection closed.
 * @param server The HTTP server to close
 * @throws Error if the server was not running
 */
async function closeServer(server: Server): Promise<void> {
    const requestsEndTimeout = setTimeout(() => {
        logger.warning(`Requests still in progress after ${REQUESTS_END_TIMEOUT_IN_MILLISECONDS} ms, their connections are closed`);
        server.closeAllConnections();
    }, REQUESTS_END_TIMEOUT_IN_MILLISECONDS);

    try {
        await new Promise<void>((resolve, reject) => {
            server.close((error?: Error) => error ? reject(error) : resolve());
        });
    } finally {
        clearTimeout(requestsEndTimeout);
    }
}
