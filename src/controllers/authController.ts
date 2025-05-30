import { Request, Response, NextFunction } from 'express';



/**
 * Sends a token to the email address provided in the request body.
 * @param req Request
 * @param req.body.email Email address to send the token to
 * @param res Return success message or error
 * @param next NextFunction
 */
export const sendToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify body request */

        /* Verify user informations */
        
        /* Generate token */

        /* Save token */

        /* Send token by email */

        /* Return success message */
        res.json({ message: 'Token sending not implemented yet.' });
    } catch (error) {
        next(error);
    }
};


/**
 * Registers a new user with the provided information.
 * @param req Request
 * @param req.body.email Email address of the user
 * @param req.body.name Optional name of the user
 * @param res Return JWT for authentication or error
 * @param next NextFunction
 */
export const registerUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Save and get user informations */

        /* Generate JWT */

        /* Return JWT */
        res.json({ message: 'User registration not implemented yet.' });
    } catch (error) {
        next(error);
    }
};


/**
 * Generates a JWT for the user based on the provided information.
 * @param req Request
 * @param req.body.email Email address of the user
 * @param req.body.token Token for verification
 * @param res Return JWT or error
 * @param next NextFunction
 */
export const getJwt = (req: Request, res: Response, next: NextFunction) => {
    try {
        /* Verify body request */

        /* Get user informations */
        
        /* Verify user informations */

        /* Generate JWT */

        /* Return JWT */
        res.json({ message: 'JWT generation not implemented yet.' });
    } catch (error) {
        next(error);
    }
}