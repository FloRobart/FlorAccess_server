import { Router } from 'express';
import * as AdminsController from './admins.controller';
import { bodyValidator } from '../../core/middlewares/validators/body_validator.middleware';
import { UserInsertSchema } from '../users/users.schema';
import { UserAdminSchema, UserAdminUpdateSchema, UserIdSchema } from './admins.schema';
import { paramsQueryValidator } from '../../core/middlewares/validators/params_query_validator.middleware';
import { requestValidator } from '../../core/middlewares/validators/request_validator.middleware';



const router = Router();



/**
 * @swagger
 * /admins/user:
 *   post:
 *     tags:
 *       - Admins
 *     summary: Register a new user
 *     description: Register a new user by providing an email address and pseudo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsertUser'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAdmin'
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
router.post('/user', bodyValidator(UserInsertSchema), AdminsController.insertUser);


/**
 * @swagger
 * /admins/users:
 *   get:
 *     tags:
 *       - Admins
 *     summary: Get all users information
 *     description: Retrieve no sensitive information about all users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserAdmin'
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
router.get('/users', AdminsController.selectUsers);


/**
 * @swagger
 * /admins/user/{userId}:
 *   put:
 *     tags:
 *       - Admins
 *     summary: Update an existing user
 *     description: Update an existing user by providing an email address and pseudo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user to update
 *         schema:
 *           type: string
 *           example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserAdminUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAdmin'
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
router.put('/user/:userId', requestValidator(UserIdSchema), requestValidator(UserAdminUpdateSchema), AdminsController.updateUser);



export default router;
