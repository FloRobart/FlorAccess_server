import { Request, Response, NextFunction } from 'express';



export const changeUserPassword = (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Password change endpoint is not implemented yet.' });
}