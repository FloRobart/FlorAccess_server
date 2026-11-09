import { describe, it, expect, vi, beforeEach } from "vitest";
import logger from "../../../src/core/utils/logger";
import { sendErrorEmail } from "../../../src/core/email/error.email";



/* The environment is read at each log : each test chooses its own */
const { mockedAppConfig } = vi.hoisted(() => ({
    mockedAppConfig: { app_name: "Floraccess", app_env: "dev" },
}));

vi.mock("../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));

vi.mock("../../../src/core/email/error.email", () => ({
    sendErrorEmail: vi.fn(),
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
        vi.mocked(sendErrorEmail).mockResolvedValue(true);
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
        expect(sendErrorEmail).not.toHaveBeenCalled();
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
        expect(sendErrorEmail).not.toHaveBeenCalled();
    });

    it('Does not write the debug logs in production', () => {
        mockedAppConfig.app_env = "prod";

        logger.debug("debug message");

        expect(consoleOutputs.debug).not.toHaveBeenCalled();
    });

    it('Sends the errors by email in production, and logs that the email was sent', async () => {
        mockedAppConfig.app_env = "prod";

        logger.error("error message", { code: 42 });
        await waitForPendingPromises();

        expect(sendErrorEmail).toHaveBeenCalledWith("error message", { code: 42 });
        expect(consoleOutputs.log).toHaveBeenCalledWith(expect.any(String), 'Error email sent successfully !');
    });

    it('Does not log a sending when the email was skipped because of the cooldown', async () => {
        mockedAppConfig.app_env = "prod";
        vi.mocked(sendErrorEmail).mockResolvedValue(false);

        logger.error("error message");
        await waitForPendingPromises();

        expect(consoleOutputs.log).not.toHaveBeenCalled();
    });

    it('Logs the failure of the error email instead of throwing it', async () => {
        mockedAppConfig.app_env = "prod";
        const emailFailure = new Error("Email sending failed");
        vi.mocked(sendErrorEmail).mockRejectedValue(emailFailure);

        logger.error("error message");
        await waitForPendingPromises();

        expect(consoleOutputs.error).toHaveBeenLastCalledWith(expect.any(String), 'Failed to send error email :', emailFailure);
    });
});


/*===========*/
/* Test data */
/*===========*/
/**
 * Lets the promises which are not awaited by the logger finish, such as the sending of the error email.
 */
function waitForPendingPromises(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}
