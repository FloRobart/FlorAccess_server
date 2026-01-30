import { z } from "zod";
import * as UserSchema from "./users.schema";



/* INSERT */
export type InsertUser = z.infer<typeof UserSchema.UserInsertSchema>;

/* SELECT */
export type UserSafe = z.infer<typeof UserSchema.UserSafeSchema>;
export type User = z.infer<typeof UserSchema.UserSchema>;
export type IPAddress = z.infer<typeof UserSchema.IPAddressSchema>;
export type AuthorizationHeader = z.infer<typeof UserSchema.AuthorizationHeaderSchema>;

/* UPDATE */
export type UpdateUser = z.infer<typeof UserSchema.UserUpdateSchema>;
/* LOGIN */
export type UserLoginRequest = z.infer<typeof UserSchema.UserLoginRequestSchema>;
export type UserLoginConfirm = z.infer<typeof UserSchema.UserLoginConfirmSchema>;

/* Email verification */
export type UserEmailVerification = z.infer<typeof UserSchema.UserEmailVerificationSchema>;
