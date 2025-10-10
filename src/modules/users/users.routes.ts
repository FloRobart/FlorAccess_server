import { Router } from 'express';
import { updateUserById, deleteUserById, insertUser, logoutUser, selectUser } from './users.controller';
import { bodyValidator } from '../../core/middlewares/body_validator.middleware';
import { InsertUserSchema, AuthorizationHeaderSchema } from './users.schema';
import { authorizationValidator } from '../../core/middlewares/auth_validator.middleware';


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
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 * /user/logout:
 *   post:
 *     tags:
 *       - User
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
router.post('/logout', logoutUser);


/**
 * @swagger
 * /user:
 *   put:
 *     tags:
 *       - User
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
 *         name: user
 *         required: true
 *         description: The user information to update
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               example: "john.doe@email.com"
 *             name:
 *               type: string
 *               example: "John Doe"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - updated
 *               properties:
 *                 updated:
 *                   type: boolean
 *                   description: Indicates if the user was updated (true) or not (false)
 *                   example: true
 *                 jwt:
 *                   type: string
 *                   description: New JWT for user authentication after update (only if updated is true)
 *                   example: "new_algo.new_payload.new_sign"
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
router.put('/', updateUserById);


/**
 * @swagger
 * /user:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete user by Id
 *     description: Delete the user associated with the provided Id. Provide the user Id in the JWT token.
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
router.delete('/', deleteUserById);



export default router;