import rateLimit from "express-rate-limit";
import AppConfig from "../../config/AppConfig";



/**
 * Rate limiter middleware to limit the number of requests from a single IP address.
 * This helps prevent abuse and ensures fair usage of the API.
 * 
 * @module middlewares/limiter
 */
export const limiter = rateLimit({
    windowMs: AppConfig.request_limit_time,
    max: Math.round(AppConfig.request_limit_per_second * (AppConfig.request_limit_time/1000)), // Limit each IP to the specified number of requests

    // Return JSON response for 429 so clients (like the swagger UI) can handle it cleanly
    handler: (_req, res) => {
        res.status(429).json({ error: "Too many requests, please try again later." });
    },
    // Enable standard rate limit headers and disable legacy ones
    standardHeaders: true,
    legacyHeaders: false,
});