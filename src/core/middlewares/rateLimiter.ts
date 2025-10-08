import rateLimit from "express-rate-limit";
import config from "../../config/config";

/**
 * Rate limiter middleware to limit the number of requests from a single IP address.
 * This helps prevent abuse and ensures fair usage of the API.
 * 
 * @module middlewares/limiter
 */
export const limiter = rateLimit({
    windowMs: config.request_limit_time * 1000, // Convert to milliseconds
    max: Math.round(config.request_limit_per_second * config.request_limit_time), // Limit each IP to the specified number of requests
    message: "Too many requests, please try again later.",
});