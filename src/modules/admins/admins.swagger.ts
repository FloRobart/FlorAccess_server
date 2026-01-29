/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     UserAdmin:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - pseudo
 *         - auth_methods_id
 *         - is_connected
 *         - is_verified_email
 *         - last_login
 *         - last_logout_at
 *         - last_ip
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
 *         auth_methods_id:
 *           type: number
 *           example: 1
 *         is_connected:
 *           type: boolean
 *           example: true
 *         is_verified_email:
 *           type: boolean
 *           example: false
 *         last_login:
 *           type: Date
 *           example: "2025-10-10T20:16:25.183Z"
 *         last_logout_at:
 *           type: Date
 *           example: "2025-10-10T20:16:25.183Z"
 *         last_ip:
 *           type: string
 *           example: "192.168.1.1"
 *         created_at:
 *           type: Date
 *           example: "2025-10-10T20:16:25.183Z"
 *         updated_at:
 *           type: Date
 *           example: "2025-10-10T20:16:25.183Z"
 */