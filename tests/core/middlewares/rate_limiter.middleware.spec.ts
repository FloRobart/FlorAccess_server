import type { Options } from "express-rate-limit";

import { describe, it, expect, vi } from "vitest";
import { authLimiter, emailLimiter, limiter, TOO_MANY_REQUESTS_MESSAGE } from "../../../src/core/middlewares/rate_limiter.middleware";
import { buildNext, buildRequest, buildResponse } from "../../fixtures/express.fixtures";



vi.mock("../../../src/config/AppConfig", () => ({
    default: {
        request_limit_per_second: 10,
        request_limit_time: 30 * 60 * 1000,
        auth_request_limit: 120,
        auth_request_limit_time: 60 * 60 * 1000,
        email_request_limit: 12,
        email_request_limit_time: 60 * 60 * 1000,
    },
}));

/* The rate limiters are replaced by the options they are created with, which are the rules tested here */
vi.mock("express-rate-limit", () => ({
    default: vi.fn((options: Partial<Options>) => options),
}));



/**
 * Rate limiters tests
 */
describe('Rate limiters', () => {
    const limiterOptions = limiter as unknown as Partial<Options>;
    const authLimiterOptions = authLimiter as unknown as Partial<Options>;
    const emailLimiterOptions = emailLimiter as unknown as Partial<Options>;


    it('Limits each IP address to the number of requests per second over the whole window', () => {
        expect(limiterOptions.windowMs).toBe(30 * 60 * 1000);
        expect(limiterOptions.max).toBe(10 * 30 * 60);
    });

    it('Limits the routes which send emails or check secrets more strictly', () => {
        expect(authLimiterOptions.windowMs).toBe(60 * 60 * 1000);
        expect(authLimiterOptions.max).toBe(120);
    });

    it('Limits even more the routes which send emails, so that one IP address can not use up the daily quota of emails', () => {
        expect(emailLimiterOptions.windowMs).toBe(60 * 60 * 1000);
        expect(emailLimiterOptions.max).toBe(12);
    });

    it('Uses the standard headers instead of the legacy ones', () => {
        for (const options of [limiterOptions, authLimiterOptions, emailLimiterOptions]) {
            expect(options.standardHeaders).toBe(true);
            expect(options.legacyHeaders).toBe(false);
        }
    });

    it('Answers with a 429 status and a JSON string, like the other errors of the API, when the limit is reached', () => {
        const response = buildResponse();

        limiterOptions.handler!(buildRequest(), response, buildNext(), {} as Options);

        expect(response.status).toHaveBeenCalledWith(429);
        expect(response.json).toHaveBeenCalledWith(TOO_MANY_REQUESTS_MESSAGE);
        expect(TOO_MANY_REQUESTS_MESSAGE).toBe("Too many requests, please try again later.");
    });
});
