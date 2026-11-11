import { Router } from 'express';
import * as UsersController from './users.controller';
import * as UsersSchema from './users.schema';
import { authorizationValidator } from '../../core/middlewares/validators/auth_validator.middleware';
import { requestValidator } from '../../core/middlewares/validators/request_validator.middleware';



const router = Router();



/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a new user
 *     description: Register a new user by providing an email address and pseudo, and send him the link which verifies his address. No JWT is given before the address is proven, the user logs in with a code once registered. The answer is the same when the address is already used, so that this route does not reveal which accounts exist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsertUser'
 *     parameters:
 *       - in: query
 *         name: application
 *         description: Name of the application where the user is being registered, displayed on the button of the verification page (never in the email)
 *         schema:
 *           type: string
 *           example: "MyApp"
 *       - in: query
 *         name: domain
 *         description: Domain name of the application where the user is being registered, target of the button of the verification page if it is one of the allowed applications
 *         schema:
 *           type: string
 *           example: "example.com"
 *     responses:
 *       202:
 *         description: Registration taken into account. A verification link was sent if the address can be used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/messageResponse'
 *       400:
 *         description: Bad request. Change your request to fix this error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
 *       429:
 *         description: Too many requests from this IP address
 *       503:
 *         description: The daily limit of new accounts or of emails is reached. Try again later
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/', requestValidator(UsersSchema.UserInsertSchema), requestValidator(UsersSchema.UserApplicationSchema), UsersController.insertUser);


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
 *     description: Update the information of an existing user. A change of email address gives no JWT, it sends a verification link to the new address and closes all the sessions of the account; the user logs in again with a code sent to the new address. The answer is the same when the new address is already used by another account.
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
 *         description: User updated successfully, without change of email address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JWTResponse'
 *       202:
 *         description: Email address change taken into account, all the sessions are closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/messageResponse'
 *       429:
 *         description: Too many requests from this IP address
 *       503:
 *         description: The daily limit of emails is reached. Try again later
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
router.put('/', authorizationValidator(UsersSchema.AuthorizationHeaderSchema), requestValidator(UsersSchema.UserUpdateSchema), UsersController.updateUser);


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
 *       403:
 *         description: The logins are temporarily blocked for this account, by its block link or because 10 login codes were sent without a successful login
 *       429:
 *         description: A login code was sent recently, or too many requests came from this IP address. Wait before requesting a new one. After 5 codes without a successful login, the delay between two codes is extended (10 minutes by default)
 *       503:
 *         description: The daily limit of new accounts or of emails is reached. Try again later
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/login/request', requestValidator(UsersSchema.UserLoginRequestSchema), UsersController.userLoginRequest);


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
 *       401:
 *         description: Invalid token, invalid code or expired code
 *       403:
 *         description: The logins are temporarily blocked for this account
 *       429:
 *         description: Too many attempts on this login code. Request a new one
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/login/confirm', requestValidator(UsersSchema.UserLoginConfirmSchema), UsersController.userLoginConfirm);


/**
 * @swagger
 * /users/login/block/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Display the login block confirmation page
 *     description: Display the page which asks the user to confirm that he wants to block the logins on his account. This is the link sent in the login code email, it does not block anything by itself.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user whose logins will be blocked.
 *         schema:
 *           type: string
 *           example: "1"
 *       - in: query
 *         name: token
 *         required: true
 *         description: The block token sent in the login code email.
 *         schema:
 *           type: string
 *           example: "block_token_here"
 *     responses:
 *       200:
 *         description: Confirmation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
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
router.get('/login/block/:userId', requestValidator(UsersSchema.UserLoginBlockSchema), UsersController.userLoginBlockPage);


/**
 * @swagger
 * /users/login/block/{userId}:
 *   post:
 *     tags:
 *       - Users
 *     summary: Block the logins of a user
 *     description: Block the logins of a user for a limited time and cancel his pending login code. If someone logged in with the code sent with this link, the user is also logged out from all his devices.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user whose logins are blocked.
 *         schema:
 *           type: string
 *           example: "1"
 *       - in: query
 *         name: token
 *         required: true
 *         description: The block token sent in the login code email.
 *         schema:
 *           type: string
 *           example: "block_token_here"
 *     responses:
 *       200:
 *         description: Page indicating the result of the block (blocked, invalid link or error)
 *         content:
 *           text/html:
 *             schema:
 *               type: string
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
router.post('/login/block/:userId', requestValidator(UsersSchema.UserLoginBlockSchema), UsersController.userLoginBlock);


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
router.get('/email/verify/:userId', requestValidator(UsersSchema.UserEmailVerificationSchema), UsersController.UserEmailVerify);



export default router;
