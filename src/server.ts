import app from './app';
import AppConfig from './config/AppConfig';
import http from 'http';
import logger from './core/utils/logger';
import { Database } from './core/models/Database.model';
import cron from 'node-cron';
import { registerGracefulShutdown, CRON_JOBS_STOP_TIMEOUT_IN_MILLISECONDS } from './core/utils/graceful_shutdown';
import { deleteUnverifiedUsersJob } from './core/cron/delete_unverified_users.job';



/* Every first day of the month, at 4 am (time zone of the server) */
const MONTHLY_JOBS_SCHEDULE = '0 4 1 * *';



/*============*/
/* Safety net */
/*============*/
/* Node.js stops the process when a rejected promise is handled by nobody. */
/* A forgotten "await" must not be enough to stop the authentication of every application, so the error is logged instead. */
process.on('unhandledRejection', (reason: unknown) => {
    logger.error("Unhandled promise rejection :", reason);
});



(async () => {
    /*========================*/
    /* Connection to Database */
    /*========================*/
    const database = new Database(AppConfig.db_uri);
    try {
        await database.connect();
        logger.success("Connected to database successfully");
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }


    /*=================*/
    /* Cron Jobs Setup */
    /*=================*/
    /* Production only: a development database must keep its test accounts */
    if (AppConfig.app_env.includes('prod')) {
        cron.schedule(MONTHLY_JOBS_SCHEDULE, runMonthlyJobs);
    }


    /*==================*/
    /* Écoute du server */
    /*==================*/
    const server = http.createServer(app);

    server.listen(AppConfig.app_port, AppConfig.host_name, () => {
        logger.success("Server running at PORT :", AppConfig.app_port, "!");
        logger.success("Server running at URL :", AppConfig.base_url, "!");
        logger.success("Server documentation running at URL :", AppConfig.base_url + "/api-docs", "!");
    });

    server.on("error", (error: Error) => {
        logger.error("FAILED STARTING SERVER\n");
        logger.error(error);
        process.exit(1);
    });


    /*===================*/
    /* Graceful shutdown */
    /*===================*/
    registerGracefulShutdown({
        server: server,
        database: database,
        stopCronJobs: () => cron.shutdown(CRON_JOBS_STOP_TIMEOUT_IN_MILLISECONDS),
    });
})();



/*===========*/
/* CRON JOBS */
/*===========*/
/**
 * Runs the monthly jobs one after the other.
 * Each job runs even if the previous one failed: they do not depend on each other.
 */
async function runMonthlyJobs(): Promise<void> {
    await runJob("deletion of the accounts whose email address was never proven", deleteUnverifiedUsersJob);
}

/**
 * Runs a job and logs how it ended. A failure is only logged, so that the next jobs still run.
 * @param jobName The name of the job, for the logs
 * @param job The job to run
 */
async function runJob(jobName: string, job: () => Promise<void>): Promise<void> {
    try {
        logger.info("Starting job :", jobName);
        await job();
        logger.success("Job completed :", jobName);
    } catch (error) {
        logger.error("Job failed :", jobName, error);
    }
}