/**
 * @swagger
 * components:
 *   schemas:
 *     error400:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           example: "Invalid email address"
 *     error401:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           example: "Unauthorized"
 *     error404:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           example: "User not found"
 *     error500:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           example: "Internal server error"
 *     messageResponse:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           example: "User registered successfully"
 *     jwtResponse:
 *       type: object
 *       required:
 *         - jwt
 *       properties:
 *         jwt:
 *           type: string
 */