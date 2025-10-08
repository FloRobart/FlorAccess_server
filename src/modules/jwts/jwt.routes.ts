import { Router } from 'express';
import { getUserFromJwt } from './jwt.controller';


const router = Router();

/**
 * @swagger
 * /jwt/user:
 *   get:
 *     tags:
 *       - API routes
 *     summary: Get user information from JWT
 *     description: Retrieve information about the authenticated user.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: API_name api_token
 *         schema:
 *           type: string
 *           example: "FlorAccess abc123token"
 *       - in: query
 *         name: jwt
 *         required: true
 *         description: JWT token for user authentication
 *         schema:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: User information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userid:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 authmethod:
 *                   type: string
 *                   example: "password"
 *       401:
 *         description: Unauthorized access.
 *       422:
 *         description: Invalid request parameters.
 *       500:
 *         description: Internal server error.
 */
router.get('/user', getUserFromJwt);


export default router;