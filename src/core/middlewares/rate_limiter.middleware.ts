import rateLimit, { Options } from "express-rate-limit";
import AppConfig from "../../config/AppConfig";



/**
 * Options shared by all the rate limiters of the API.
 */
const sharedOptions: Partial<Options> = {
    // Return JSON response for 429 so clients (like the swagger UI) can handle it cleanly
    handler: (_req, res) => {
        res.status(429).json({ error: "Too many requests, please try again later." });
    },
    // Enable standard rate limit headers and disable legacy ones
    standardHeaders: true,
    legacyHeaders: false,
};


/**
 * Rate limiter middleware to limit the number of requests from a single IP address.
 * This helps prevent abuse and ensures fair usage of the API.
 *
 * @module middlewares/limiter
 */
export const limiter = rateLimit({
    ...sharedOptions,
    windowMs: AppConfig.request_limit_time,
    max: Math.round(AppConfig.request_limit_per_second * (AppConfig.request_limit_time/1000)), // Limit each IP to the specified number of requests
});


/**
 * Stricter rate limiter for the routes which send emails or check secrets (registration, login, email verification).
 * The general limiter allows thousands of requests, which is enough to use up the sending quota of the mail account
 * or to try many secrets : these routes only need a few requests per user.
 *
 * @module middlewares/authLimiter
 */
export const authLimiter = rateLimit({
    ...sharedOptions,
    windowMs: AppConfig.auth_request_limit_time,
    max: AppConfig.auth_request_limit,
});
