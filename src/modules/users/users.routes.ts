import { Router } from 'express';
import * as UsersController from './users.controller';
import { bodyValidator } from '../../core/middlewares/validators/body_validator.middleware';
import * as UsersSchema from './users.schema';
import { authorizationValidator } from '../../core/middlewares/validators/auth_validator.middleware';
import { paramsQueryValidator } from '../../core/middlewares/validators/params_query_validator.middleware';



const router = Router();



/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a new user
 *     description: Register a new user by providing an email address and pseudo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsertUser'
 *     parameters:
 *       - in: query
 *         name: application
 *         description: Name of the application where the user is being registered
 *         schema:
 *           type: string
 *           example: "MyApp"
 *       - in: query
 *         name: domain
 *         description: Domain name of the application where the user is being registered
 *         schema:
 *           type: string
 *           example: "example.com"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JWTResponse'
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/', bodyValidator(UsersSchema.UserInsertSchema), UsersController.insertUser);


/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user information from JWT
 *     description: Retrieve information about the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSafe'
 *       401:
 *         description: Unauthorized access.
 *       422:
 *         description: Invalid request parameters.
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.get('/', authorizationValidator(UsersSchema.AuthorizationHeaderSchema), UsersController.selectUser);


/**
 * @swagger
 * /users/jwt:
 *   get:
 *     tags:
 *       - Users
 *     summary: Regenerate JWT
 *     description: Regenerate a new JWT for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New JWT generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JWTResponse'
 *       401:
 *         description: Unauthorized access.
 *       422:
 *         description: Invalid request parameters.
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.get('/jwt', authorizationValidator(UsersSchema.AuthorizationHeaderSchema), UsersController.regenerateJwt);


/**
 * @swagger
 * /users:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user information
 *     description: Update the information of an existing user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JWTResponse'
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.put('/', authorizationValidator(UsersSchema.AuthorizationHeaderSchema), bodyValidator(UsersSchema.UserUpdateSchema), UsersController.updateUser);


/**
 * @swagger
 * /users:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
 *     description: Delete the user associated with the provided JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message for successful deletion
 *                   example: "User deleted successfully."
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.delete('/', authorizationValidator(UsersSchema.AuthorizationHeaderSchema), UsersController.deleteUser);


/**
 * @swagger
 * /users/login/request:
 *   post:
 *     tags:
 *       - Users
 *     summary: Request login for a user
 *     description: Request login for a user by providing the necessary credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *     responses:
 *       200:
 *         description: token to confirm user login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLoginRequestResponse'
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error404'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/login/request', bodyValidator(UsersSchema.UserLoginRequestSchema), UsersController.userLoginRequest);


/**
 * @swagger
 * /users/login/confirm:
 *   post:
 *     tags:
 *       - Users
 *     summary: Confirm login for a user
 *     description: Confirm login for a user by providing the necessary credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginConfirm'
 *     responses:
 *       200:
 *         description: token to confirm user login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JWTResponse'
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/login/confirm', bodyValidator(UsersSchema.UserLoginConfirmSchema), UsersController.userLoginConfirm);


/**
 * @swagger
 * /users/logout:
 *   post:
 *     tags:
 *       - Users
 *     summary: Logout a user
 *     description: Logout a user by invalidating the authentication token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       401:
 *         description: Unauthorized. Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error401'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/logout', authorizationValidator(UsersSchema.AuthorizationHeaderSchema), UsersController.logoutUser);


/**
 * @swagger
 * /users/email/verify:
 *   get:
 *     tags:
 *       - Users
 *     summary: Verify user email
 *     description: Verify a user's email address using a verification token.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user whose email is being verified.
 *         schema:
 *           type: string
 *           example: "1"
 *       - in: query
 *         name: token
 *         required: true
 *         description: The verification token sent to the user's email address.
 *         schema:
 *           type: string
 *           example: "verification_token_here"
 *       - in: query
 *         name: application
 *         description: Name of the application where the email verification is being performed
 *         schema:
 *           type: string
 *           example: "MyApp"
 *       - in: query
 *         name: domain
 *         description: Domain name of the application where the email verification is being performed
 *         schema:
 *           type: string
 *           example: "example.com"
 *     responses:
 *       200:
 *         description: token to confirm user login
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML content indicating the result of the email verification
 *               example: "<html><body><h1>Email Verified</h1><p>Your email has been successfully verified.</p></body></html>"
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       401:
 *         description: Unauthorized. Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error401'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.get('/email/verify/:userId', paramsQueryValidator(UsersSchema.UserEmailVerificationSchema), UsersController.UserEmailVerify);



export default router;
