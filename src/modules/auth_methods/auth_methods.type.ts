import { z } from "zod";
import { AuthMethodSchema, UserAuthMethodSafeSchema, UserAuthMethodSchema } from "./auth_methods.schema";



/* SELECT */
export type AuthMethod = z.infer<typeof AuthMethodSchema>;
export type UserAuthMethodSafe = z.infer<typeof UserAuthMethodSafeSchema>;
export type UserAuthMethod = z.infer<typeof UserAuthMethodSchema>;