import { describe, it, expect, vi, beforeEach } from "vitest";
import logger from "../../../src/core/utils/logger";



/* The environment is read at each log : each test chooses its own */
const { mockedAppConfig } = vi.hoisted(() => ({
    mockedAppConfig: { app_name: "Floraccess", app_env: "dev" },
}));

vi.mock("../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));



/**
 * Logger tests
 */
describe('Logger', () => {
    const consoleOutputs = {
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };

    beforeEach(() => {
        mockedAppConfig.app_env = "dev";
    });


    it('Writes each level of log with the name of the application in the development environment', () => {
        logger.error("error message");
        logger.warning("warning message");
        logger.success("success message");
        logger.info("info message");
        logger.debug("debug message");

        expect(consoleOutputs.error).toHaveBeenCalledWith(expect.stringContaining("Floraccess"), "error message");
        expect(consoleOutputs.warn).toHaveBeenCalledWith(expect.stringContaining("Floraccess"), "warning message");
        expect(consoleOutputs.log).toHaveBeenCalledWith(expect.stringContaining("Floraccess"), "success message");
        expect(consoleOutputs.info).toHaveBeenCalledWith(expect.stringContaining("Floraccess"), "info message");
        expect(consoleOutputs.debug).toHaveBeenCalledWith(expect.stringContaining("Floraccess"), "debug message");
    });

    it('Writes nothing in a silent environment', () => {
        mockedAppConfig.app_env = "prod-silent";

        logger.error("error message");
        logger.warning("warning message");
        logger.success("success message");
        logger.info("info message");
        logger.debug("debug message");

        for (const consoleOutput of Object.values(consoleOutputs)) {
            expect(consoleOutput).not.toHaveBeenCalled();
        }
    });

    it('Does not write the debug logs in production', () => {
        mockedAppConfig.app_env = "prod";

        logger.debug("debug message");

        expect(consoleOutputs.debug).not.toHaveBeenCalled();
    });

    it('Writes the errors in production', () => {
        mockedAppConfig.app_env = "prod";

        logger.error("error message", { code: 42 });

        expect(consoleOutputs.error).toHaveBeenCalledWith(expect.stringContaining("Floraccess"), "error message", { code: 42 });
    });
});
