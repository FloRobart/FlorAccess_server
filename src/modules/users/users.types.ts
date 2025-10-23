import { z } from "zod";
import { AuthorizationHeaderSchema, UserInsertSchema, IPAddressSchema, UserLoginRequestSchema, UserUpdateSchema, UserSafeSchema, UserSchema, UserLoginConfirmSchema } from "./users.schema";



/* INSERT */
export type InsertUser = z.infer<typeof UserInsertSchema>;

/* SELECT */
export type UserSafe = z.infer<typeof UserSafeSchema>;
export type User = z.infer<typeof UserSchema>;
export type IPAddress = z.infer<typeof IPAddressSchema>;
export type AuthorizationHeader = z.infer<typeof AuthorizationHeaderSchema>;

/* UPDATE */
export type UpdateUser = z.infer<typeof UserUpdateSchema>;

/* LOGIN */
export type UserLoginRequest = z.infer<typeof UserLoginRequestSchema>;
export type UserLoginConfirm = z.infer<typeof UserLoginConfirmSchema>;