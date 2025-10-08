import { Router } from 'express';
import { loginRequest, loginConfirmation } from './codeController';


const router = Router();


/**
 * @swagger
 * /code/login/request:
 *   post:
 *     tags:
 *       - Code
 *       - Login
 *     summary: Request login
 *     description: Request a login by providing an email address. An code will be sent to the provided email address.
 *     parameters:
 *       - in: body
 *         schema:
 *           type: object
 *           required:
 *             - email
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: The email address to which the login code will be sent
 *               example: "john.doe@email.com"
 *     responses:
 *       200:
 *         description: email sent successfully
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/error400'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/error500'
 */
router.post('/login/request', loginRequest);


/**
 * @swagger
 * /code/login/confirm:
 *   post:
 *     tags:
 *       - Code
 *       - Login
 *     summary: Confirm login
 *     description: Confirm a login by providing the email address and the code sent to that address.
 *     parameters:
 *       - in: body
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - code
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: The email address to which the login code was sent
 *               example: "john.doe@email.com"
 *             code:
 *               type: string
 *               description: The login code sent to the email address
 *               example: "ABC123"
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - jwt
 *               properties:
 *                 jwt:
 *                   type: string
 *                   description: Crypted JWT for user authentication
 *                   example: "ABCDEF"
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/error400'
 *       401:
 *         description: Unauthorized. Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/error401'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/error500'
 */
router.post('/login/confirm', loginConfirmation);



export default router;