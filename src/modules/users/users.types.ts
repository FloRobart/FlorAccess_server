import { z } from "zod";
import { AuthorizationHeaderSchema, InsertUserSchema, IPAddressSchema, UpdateUserSchema, UserSafeSchema, UserSchema } from "./users.schema";



/* INSERT */
export type InsertUser = z.infer<typeof InsertUserSchema>;

/* SELECT */
export type UserSafe = z.infer<typeof UserSafeSchema>;
export type User = z.infer<typeof UserSchema>;
export type IPAddress = z.infer<typeof IPAddressSchema>;
export type AuthorizationHeader = z.infer<typeof AuthorizationHeaderSchema>;

/* UPDATE */
export type UpdateUser = z.infer<typeof UpdateUserSchema>;