import type { Server } from "node:http";
import type { IDatabase } from "../../../src/core/models/Database.model";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerGracefulShutdown, REQUESTS_END_TIMEOUT_IN_MILLISECONDS, shutDownGracefully, ShutdownResources } from "../../../src/core/utils/graceful_shutdown";
import logger from "../../../src/core/utils/logger";



vi.mock("../../../src/core/utils/logger", () => ({
    default: { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));



/**
 * Graceful shutdown tests
 */
describe('Graceful shutdown', () => {
    let stopOrder: string[];

    beforeEach(() => {
        stopOrder = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGINT');
    });


    /*==========*/
    /* Shutdown */
    /*==========*/
    describe('Shutdown', () => {
        it('Stops the cron jobs, then the server, then the database, and exits with 0', async () => {
            const resources = buildShutdownResources(stopOrder);

            await expect(shutDownGracefully(resources)).resolves.toBe(0);

            expect(stopOrder).toStrictEqual(["cron jobs", "server", "database"]);
            expect(logger.success).toHaveBeenCalledWith("Server stopped cleanly");
        });

        it('Closes the connections of the requests still in progress after the delay', async () => {
            vi.useFakeTimers();
            const resources = buildShutdownResources(stopOrder, { serverEndsItsRequests: false });

            const shutdown = shutDownGracefully(resources);
            await vi.advanceTimersByTimeAsync(REQUESTS_END_TIMEOUT_IN_MILLISECONDS);

            await expect(shutdown).resolves.toBe(0);
            expect(resources.server.closeAllConnections).toHaveBeenCalledTimes(1);
            expect(logger.warning).toHaveBeenCalledTimes(1);
        });

        it('Does not close the connections of the requests which end in time', async () => {
            vi.useFakeTimers();
            const resources = buildShutdownResources(stopOrder);

            await shutDownGracefully(resources);
            await vi.advanceTimersByTimeAsync(REQUESTS_END_TIMEOUT_IN_MILLISECONDS);

            expect(resources.server.closeAllConnections).not.toHaveBeenCalled();
        });

        it('Exits with 1 and logs the error when the server cannot be closed', async () => {
            const closeError = new Error("Server is not running");
            const resources = buildShutdownResources(stopOrder, { closeError: closeError });

            await expect(shutDownGracefully(resources)).resolves.toBe(1);

            expect(resources.database.close).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith("Failed to stop the server cleanly :", closeError);
        });

        it('Exits with 1 when the database cannot be closed', async () => {
            const resources = buildShutdownResources(stopOrder);
            vi.mocked(resources.database.close).mockRejectedValue(new Error("Database disconnection failed"));

            await expect(shutDownGracefully(resources)).resolves.toBe(1);
        });
    });


    /*=========*/
    /* Signals */
    /*=========*/
    describe('Signals', () => {
        it.each(['SIGTERM', 'SIGINT'] as const)('Stops the server and exits the process on %s', async (signal) => {
            const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
            const resources = buildShutdownResources(stopOrder);
            registerGracefulShutdown(resources);

            process.emit(signal, signal);
            await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));

            expect(stopOrder).toStrictEqual(["cron jobs", "server", "database"]);
            exit.mockRestore();
        });

        it('Ignores a second signal during the shutdown', async () => {
            const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
            const resources = buildShutdownResources(stopOrder);
            registerGracefulShutdown(resources);

            process.emit('SIGTERM', 'SIGTERM');
            process.emit('SIGINT', 'SIGINT');
            await vi.waitFor(() => expect(exit).toHaveBeenCalledTimes(1));

            expect(resources.stopCronJobs).toHaveBeenCalledTimes(1);
            exit.mockRestore();
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
/**
 * Builds fake resources which write in stopOrder when they stop.
 * @param stopOrder List filled with the name of each resource when it stops
 * @param options serverEndsItsRequests: false to keep the server waiting for its requests until its connections are closed,
 * closeError: error given by the server when it is closed
 * @returns The fake resources
 */
function buildShutdownResources(stopOrder: string[], options: { serverEndsItsRequests?: boolean, closeError?: Error } = {}): ShutdownResources {
    let endRequests: () => void = () => {};

    const server = {
        close: vi.fn((callback: (error?: Error) => void) => {
            stopOrder.push("server");
            endRequests = () => callback(options.closeError);
            if (options.serverEndsItsRequests !== false) { endRequests(); }
        }),
        closeAllConnections: vi.fn(() => endRequests()),
    };

    const database = {
        connect: vi.fn(),
        close: vi.fn(async () => { stopOrder.push("database"); }),
    };

    return {
        server: server as unknown as Server,
        database: database as IDatabase,
        stopCronJobs: vi.fn(async () => { stopOrder.push("cron jobs"); }),
    };
}
