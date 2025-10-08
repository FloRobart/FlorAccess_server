import { Router } from 'express';
import { changeUserPassword } from './passwordController';



const router = Router();



/**
 * 
 * /password:
 *   put:
 *     tags:
 *       - Password
 *     summary: Change user password
 *     description: Change the password of the user associated with the provided JWT token.
 *     parameters:
 *       - in: body
 *         name: password
 *         required: true
 *         description: The new password for the user
 *         schema:
 *           type: object
 *           properties:
 *             password:
 *               type: string
 *               format: password
 *               example: "newsecurepassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - changed
 *               properties:
 *                 changed:
 *                   type: boolean
 *                   description: Indicates if the password was changed (true) or not (false)
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
// router.put('/', changeUserPassword);



export default router;