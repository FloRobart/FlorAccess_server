import type { Request } from 'express';

import morgan from 'morgan';
import AppConfig from '../../config/AppConfig';
import { verifyJwt } from '../utils/jwt';



const UNKNOWN_USER = "Unknown User";

/* Value of the "token" query parameter, which carries the secret of the links sent by email */
const TOKEN_QUERY_PARAMETER_REGEX = /([?&]token=)[^&#]*/gi;



/**
 * Names the user of a request in the access logs.
 * The user is named by his ID, never by his email address: the logs must not collect personal data.
 * @param req Request
 * @returns "user-<id>" for a valid JWT, otherwise "Unknown User"
 */
export function getLoggedUser(req: Request): string {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) { return UNKNOWN_USER; }

    try {
        return `user-${verifyJwt(token).id}`;
    } catch (error) {
        return UNKNOWN_USER;
    }
}


/**
 * Hides the token of the links sent by email (email verification, login block) in an URL.
 * Anyone who reads the logs could otherwise use these links in place of the user.
 * @param url URL to clean, or undefined
 * @returns The URL with "[REDACTED]" in place of the token, or undefined
 */
export function redactUrlSecrets(url: string | undefined): string | undefined {
    return url?.replace(TOKEN_QUERY_PARAMETER_REGEX, '$1[REDACTED]');
}


/**
 * Reads the requested URL for the access logs, without the token of the links sent by email.
 * @param req Request
 * @returns The requested URL, cleaned
 */
export function getLoggedUrl(req: Request): string | undefined {
    return redactUrlSecrets(req.originalUrl || req.url);
}


/**
 * Reads the referrer of a request for the access logs, without the token of the links sent by email.
 * The requests sent from the pages of these links (form, styles, icons) carry the URL of the page as referrer, so its token.
 * @param req Request
 * @returns The referrer, cleaned, or undefined if the request has none
 */
export function getLoggedReferrer(req: Request): string | undefined {
    return redactUrlSecrets(req.get("referer"));
}


/* These tokens replace the ones of the same name defined by morgan */
morgan.token("remote-user", getLoggedUser);
morgan.token("url", getLoggedUrl);
morgan.token("referrer", getLoggedReferrer);



/**
 * Middleware which writes one line per request in the access logs.
 */
export const requestLogger = morgan(AppConfig.log_format);
