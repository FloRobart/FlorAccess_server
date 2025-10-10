/*========*/
/* INSERT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     InsertUser:
 *       type: object
 *       required:
 *         - email
 *         - pseudo
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         pseudo:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: "John doe"
 *     JWTResponse:
 *       type: object
 *       required:
 *         - jwt
 *       properties:
 *         jwt:
 *           type: string
 *           description: JWT for user authentication
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */




/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     UserSafe:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - pseudo
 *         - is_connected
 *         - is_verified_email
 *         - last_login
 *         - created_at
 *         - updated_at
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         email:
 *           type: string
 *           example: "john.doe@email.com"
 *         pseudo:
 *           type: string
 *           example: "John Doe"
 *         is_connected:
 *           type: boolean
 *           example: true
 *         is_verified_email:
 *           type: boolean
 *           example: false
 *         last_login:
 *           type: Date
 *           example: "2025-10-10T20:16:25.183Z"
 *         created_at:
 *           type: Date
 *           example: "2025-10-10T20:16:25.183Z"
 *         updated_at:
 *           type: Date
 *           example: "2025-10-10T20:16:25.183Z"
 *         auth_methods:
 *           type: array
 *           items:
 *             type: object
 *             description: List of authentication methods associated with the user
 *             required:
 *               - id
 *               - user_id
 *               - auth_method_id
 *               - created_at
 *               - updated_at
 *             properties:
 *               id:
 *                 type: number
 *                 example: 1
 *               user_id:
 *                 type: number
 *                 example: 1
 *               auth_method_id:
 *                 type: number
 *                 example: 1
 *               created_at:
 *                 type: Date
 *                 example: "2025-10-10T20:16:25.183Z"
 *               updated_at:
 *                 type: Date
 *                 example: "2025-10-10T20:16:25.183Z"
 */



/*========*/
/* UPDATE */
/*========*/




/*========*/
/* DELETE */
/*========*/