import { Request, Response, NextFunction } from 'express';




/**
 * Sends a token to the email address provided in the request body.
 * @POST /handshake
 * @param req Request
 * @param res Return success message or error
 * @param next NextFunction
 */
export const handshake = (req: Request, res: Response, next: NextFunction) => {
    // TODO : Implement handshake logic
};