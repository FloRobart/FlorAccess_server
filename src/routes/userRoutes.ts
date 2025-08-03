import { Router } from 'express';
import { updateUserById, deleteUserById, verifyEmail, registerUser } from '../controllers/userController';


const router = Router();

/**
 * TODO : Routes deleted because they cause data leakage problems
 *
 * /user/existing/{email}:
 *   get:
 *     tags:
 *       - User
 *     summary: Verify if email is valid (if user exists)
 *     description: Check if the provided email address is associated with an existing user. If the user exists '1' is returned, otherwise '0' is returned.
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: The email address to verify
 *         schema:
 *           type: string
 *           format: email
 *           example: "john.doe@mail.com"
 *     responses:
 *       200:
 *         description: Email verification result. true if user exists, false if user does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - email
 *                 - exists
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The email address that was verified
 *                   example: "john.doe@mail.com"
 *                 exists:
 *                   type: boolean
 *                   description: Indicates if the user exists (true) or not (false)
 *                   example: true
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
// router.get('/existing/:email', verifyEmail);


/**
 * @swagger
 * /user/register:
 *   post:
 *     tags:
 *       - User
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
 *               type: object
 *               required:
 *                 - jwt
 *               properties:
 *                 jwt:
 *                   type: string
 *                   description: JWT for user authentication
 *                   example: "algo.payload.sign"
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
router.post('/register', registerUser);


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
 *               example: "john.doe@mail.com"
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
 *               $ref: '#components/schemas/error400'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/error500'
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
 *               $ref: '#components/schemas/error400'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/error500'
 */
router.delete('/', deleteUserById);



export default router;