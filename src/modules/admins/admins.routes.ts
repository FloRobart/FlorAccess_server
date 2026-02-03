import { Router } from 'express';
import * as AdminsController from './admins.controller';
import { requestValidator } from '../../core/middlewares/validators/request_validator.middleware';
import { UserInsertSchema } from '../users/users.schema';
import * as AdminsSchema from './admins.schema';



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
router.post('/user', requestValidator(UserInsertSchema), AdminsController.insertUser);


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
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         description: The maximum number of users to return (default is all users)
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: offset
 *         required: false
 *         description: The number of users to skip before starting to collect the result set (default is 0)
 *         schema:
 *           type: integer
 *           example: 0
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
router.get('/users', requestValidator(AdminsSchema.authorizedQueryParamsSchema), AdminsController.selectUsers);


/**
 * @swagger
 * /admins/users/count:
 *   get:
 *     tags:
 *       - Admins
 *     summary: Get the count of all users
 *     description: Retrieve the count of all users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The count of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - count
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 42
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
router.get('/users/count', AdminsController.countUsers);


/**
 * @swagger
 * /admins/user/{userId}:
 *   put:
 *     tags:
 *       - Admins
 *     summary: Update an existing user
 *     description: Update an existing user
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
router.put('/user/:userId', requestValidator(AdminsSchema.UserIdSchema), requestValidator(AdminsSchema.UserAdminUpdateSchema), AdminsController.updateUser);


/**
 * @swagger
 * /admins/user/{userId}:
 *   delete:
 *     tags:
 *       - Admins
 *     summary: Delete an existing user
 *     description: Delete an existing user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user to delete
 *         schema:
 *           type: string
 *           example: "1"
 *     responses:
 *       200:
 *         description: User deleted successfully
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
router.delete('/user/:userId', requestValidator(AdminsSchema.UserIdSchema), AdminsController.deleteUser);


/**
 * @swagger
 * /admins/users/send/verify-email:
 *   post:
 *     tags:
 *       - Admins
 *     summary: Send verification emails to a list of users
 *     description: Sends verification emails to a list of users by providing their user IDs.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserIdList'
 *     responses:
 *       200:
 *         description: Verification emails sent successfully. Return the list of user IDs for whom the email was sent.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserIdList'
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
router.post('/users/send/verify-email', requestValidator(AdminsSchema.UserIdListParamsSchema), AdminsController.sendVerifyEmail);


/**
 * @swagger
 * /admins/users/send/email:
 *   post:
 *     tags:
 *       - Admins
 *     summary: Send emails to a list of users
 *     description: Sends emails to a list of users by providing their user IDs, subject, and message.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailAdmin'
 *     responses:
 *       200:
 *         description: Emails sent successfully. Return the list of user IDs for whom the email was sent.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserIdList'
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
router.post('/users/send/email', requestValidator(AdminsSchema.EmailAdminSchema), AdminsController.sendEmailAdmin);



export default router;
