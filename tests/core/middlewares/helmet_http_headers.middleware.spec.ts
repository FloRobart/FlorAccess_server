import type { HelmetOptions } from "helmet";

import { describe, it, expect, vi } from "vitest";



/* The options are computed at the import, from the environment of the configuration */
const { mockedAppConfig } = vi.hoisted(() => ({
    mockedAppConfig: { app_env: "dev" },
}));

vi.mock("../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));



/**
 * Helmet HTTP headers tests
 */
describe('Helmet HTTP headers', () => {
    it('Disables the policies which break the Swagger UI in the development environment', async () => {
        const helmetOptions = await loadHelmetOptions("dev");

        expect(helmetOptions.contentSecurityPolicy).toBe(false);
        expect(helmetOptions.hsts).toBe(false);
        expect(helmetOptions.crossOriginOpenerPolicy).toBe(false);
    });

    it('Enables the content security policy, HSTS and the opener policy in production', async () => {
        const helmetOptions = await loadHelmetOptions("prod");

        expect(helmetOptions.contentSecurityPolicy).toMatchObject({ directives: { defaultSrc: ["'none'"], formAction: ["'self'"] } });
        expect(helmetOptions.hsts).toStrictEqual({ maxAge: 63072000, includeSubDomains: true, preload: true });
        expect(helmetOptions.crossOriginOpenerPolicy).toStrictEqual({ policy: 'same-origin' });
    });

    it('Forbids the display of the API in a frame in every environment', async () => {
        const helmetOptions = await loadHelmetOptions("prod");

        expect(helmetOptions.frameguard).toStrictEqual({ action: 'deny' });
        expect(helmetOptions.noSniff).toBe(true);
    });
});


/*===========*/
/* Test data */
/*===========*/
/**
 * Loads a fresh copy of the Helmet options, because they read the environment when they are imported.
 * @param appEnvironment Environment of the application
 * @returns Helmet options computed for this environment
 */
async function loadHelmetOptions(appEnvironment: string): Promise<HelmetOptions> {
    mockedAppConfig.app_env = appEnvironment;
    vi.resetModules();

    return (await import("../../../src/core/middlewares/helmet_http_headers.middleware")).helmetOptions;
}
