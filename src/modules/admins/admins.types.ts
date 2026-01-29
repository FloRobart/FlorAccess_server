import { z } from "zod";
import * as AdminsSchema from "./admins.schema";



export type UserAdmin = z.infer<typeof AdminsSchema.UserAdminSchema>;
export type UserId = z.infer<typeof AdminsSchema.UserIdSchema>;
export type UserAdminUpdate = z.infer<typeof AdminsSchema.UserAdminUpdateSchema>;
