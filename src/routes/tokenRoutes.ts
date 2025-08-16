import { Router } from 'express';
import { sendToken, getJwt, verifyToken } from '../controllers/tokenController';



const router = Router();



/**
 * @swagger
 * /token/send-token:
 *   post:
 *     tags:
 *       - Token
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
router.post('/send-token', sendToken);

/**
 * @swagger
 * /token/login:
 *   post:
 *     tags:
 *       - Token
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
 *         description: JWT generated and sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/jwtResponse'
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
router.get('/login', getJwt);

/**
 * @swagger
 * /token/verify-token/{jwt}:
 *   get:
 *     tags:
 *       - Token
 *     summary: Verify a JWT
 *     description: Verify the authenticity of a JWT.
 *     parameters:
 *       - in: headers
 *         name: Authorization
 *         required: true
 *         description: private token of API
 *         schema:
 *           type: string
 *           example: "private_api_token.name"
 *       - in: path
 *         name: jwt
 *         required: true
 *         description: The JWT to verify
 *     responses:
 *       200:
 *         description: JWT is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                   description: The ID of the user associated with the JWT
 *                   example: 123
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The email address of the user associated with the JWT
 *                   example: "john.doe@mail.com"
 *                 name:
 *                   type: string
 *                   description: The name of the user associated with the JWT
 *                   example: "John Doe"
 *       401:
 *         description: Unauthorized. The JWT is invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired JWT"
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
router.get('/verify-token/:jwt', verifyToken);

export default router;