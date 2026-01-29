import { z } from "zod";
import * as AdminsSchema from "./admins.schema";



export type UserAdmin = z.infer<typeof AdminsSchema.UserAdminSchema>;
