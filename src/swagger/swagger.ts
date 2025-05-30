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