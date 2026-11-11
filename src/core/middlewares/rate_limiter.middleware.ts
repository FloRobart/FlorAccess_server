import rateLimit, { Options } from "express-rate-limit";
import AppConfig from "../../config/AppConfig";



export const TOO_MANY_REQUESTS_MESSAGE = "Too many requests, please try again later.";



/**
 * Options shared by all the rate limiters of the API.
 */
const sharedOptions: Partial<Options> = {
    /* A JSON string, like every other error of the API: the clients read all the errors the same way */
    handler: (_req, res) => {
        res.status(429).json(TOO_MANY_REQUESTS_MESSAGE);
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


/**
 * Rate limiter for the routes which make the API send emails
 * (registration, login code, change of email address, emails of the administrators).
 * Each of these requests costs at least one email of the daily quota of the mail account : a single IP address
 * must not be able to use up this quota, which would stop the login codes of every user.
 *
 * @module middlewares/emailLimiter
 */
export const emailLimiter = rateLimit({
    ...sharedOptions,
    windowMs: AppConfig.email_request_limit_time,
    max: AppConfig.email_request_limit,
});
