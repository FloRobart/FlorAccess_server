import { z } from "zod";
import { AuthMethodSchema } from "./auth_methods.schema";



/* SELECT */
export type AuthMethod = z.infer<typeof AuthMethodSchema>;