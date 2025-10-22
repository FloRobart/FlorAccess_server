import { Router } from 'express';
import { updateUser, deleteUser, insertUser, logoutUser, selectUser, userLoginRequest, userLoginConfirm } from './users.controller';
import { bodyValidator } from '../../core/middlewares/validators/body_validator.middleware';
import { InsertUserSchema, AuthorizationHeaderSchema, UpdateUserSchema, UserLoginRequestSchema, UserLoginConfirmSchema } from './users.schema';
import { authorizationValidator } from '../../core/middlewares/validators/auth_validator.middleware';


const router = Router();



/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a new user
 *     description: Register a new user by providing an email address and pseudo.
 *     parameters:
 *       - in: body
 *         schema:
 *           $ref: '#/components/schemas/InsertUser'
 *     responses:
 *       200:
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
router.post('/', bodyValidator(InsertUserSchema), insertUser);


/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user information from JWT
 *     description: Retrieve information about the authenticated user.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: JWT
 *         schema:
 *           type: string
 *           example: "Bearer your_jwt_token_here"
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
router.get('/', authorizationValidator(AuthorizationHeaderSchema), selectUser);


/**
 * @swagger
 * /users:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user information
 *     description: Update the information of an existing user.
 *     parameters:
 *       - in: headers
 *         name: Authorization
 *         required: true
 *         description: JWT token for user authentication
 *         schema:
 *           type: string
 *           example: "Bearer your_jwt_token_here"
 *       - in: body
 *         schema:
 *           $ref: '#/components/schemas/UpdateUser'
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
router.put('/', authorizationValidator(AuthorizationHeaderSchema), bodyValidator(UpdateUserSchema), updateUser);


/**
 * @swagger
 * /users:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
 *     description: Delete the user associated with the provided JWT token.
 *     parameters:
 *       - in: headers
 *         name: Authorization
 *         required: true
 *         description: JWT token for user authentication
 *         schema:
 *           type: string
 *           example: "Bearer your_jwt_token_here"
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
router.delete('/', authorizationValidator(AuthorizationHeaderSchema), deleteUser);


/**
 * @swagger
 * /users/login/request:
 *   post:
 *     tags:
 *       - Users
 *     summary: Request login for a user
 *     description: Request login for a user by providing the necessary credentials.
 *     parameters:
 *       - in: body
 *         schema:
 *           $ref: '#/components/schemas/UserLoginRequest'
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
router.post('/login/request', bodyValidator(UserLoginRequestSchema), userLoginRequest);


/**
 * @swagger
 * /users/login/confirm:
 *   post:
 *     tags:
 *       - Users
 *     summary: Confirm login for a user
 *     description: Confirm login for a user by providing the necessary credentials.
 *     parameters:
 *       - in: body
 *         schema:
 *           $ref: '#/components/schemas/UserLoginConfirm'
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
router.post('/login/confirm', bodyValidator(UserLoginConfirmSchema), userLoginConfirm);


/**
 * @swagger
 * /users/logout:
 *   post:
 *     tags:
 *       - Users
 *     summary: Logout a user
 *     description: Logout a user by invalidating the authentication token.
 *     parameters:
 *       - in: headers
 *         name: Authorization
 *         required: true
 *         description: JWT token for user authentication
 *         schema:
 *           type: string
 *           example: "Bearer your_jwt_token_here"
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
router.post('/logout', authorizationValidator(AuthorizationHeaderSchema), logoutUser);



export default router;