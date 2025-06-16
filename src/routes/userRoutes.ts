import { Router } from 'express';
import { updateUserById, deleteUserById, verifyEmail } from '../controllers/userController';



const router = Router();

/**
 * @swagger
 * /user/existing/{email}:
 *   get:
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
router.get('/existing/:email', verifyEmail);


/**
 * @swagger
 * /user:
 *   put:
 *     summary: Update user information
 *     description: Update the information of an existing user.
 *     parameters:
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
 *             password:
 *               type: string
 *               format: password
 *               example: "securepassword123"
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
router.put('/', updateUserById);


/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Delete user by Id
 *     description: Delete the user associated with the provided Id. Provide the user Id in the JWT token.
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
router.delete('/', deleteUserById);



export default router;