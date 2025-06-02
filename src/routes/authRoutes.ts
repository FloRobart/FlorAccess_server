import { Router } from 'express';
import {
    sendToken,
    registerUser,
    getJwt,
} from '../controllers/authController';



const router = Router();



/**
 * @swagger
 * /send/token:
 *   post:
 *     summary: Send a new authentication token to the email address
 *     description: Generate, save and send a new authentication token to the email address passed in the request body
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
 *               description: The email address to which the authentication token will be sent
 *             app_name:
 *               type: string
 *               description: The name of the application to be used in the email subject
 *     responses:
 *       200:
 *         description: Token sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token sent successfully"
 *       400:
 *         description: Bad request. Change your request for to fix this error
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
router.post('/send/token', sendToken);


/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user by providing an email address and name. An authentication token will be sent to the provided email address.
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
 *               description: The email address to which the authentication token will be sent
 *               example: "john.doe@mail.com"
 *             name:
 *               type: string
 *               description: The name of the user
 *               example: "John Doe"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/messageResponse'
 *       400:
 *         description: Bad request. Change your request for to fix this error
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
router.post('/register', registerUser);


/**
 * @swagger
 * /jwt:
 *   post:
 *     summary: Get JWT with email and token
 *     description: Generate a JWT using the email address and the authentication token sent to the user's email address.
 *     parameters:
 *       - in: body
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - token
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: The email address to which the authentication token will be sent
 *               example: "john.doe@mail.com"
 *             token:
 *               type: string
 *               description: The authentication token sent to the user's email address
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/jwtResponse'
 *       400:
 *         description: Bad request. Change your request for to fix this error
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
router.get('/jwt', getJwt);


export default router;