import { z } from "zod";
import * as AdminsSchema from "./admins.schema";



export type UserAdmin = z.infer<typeof AdminsSchema.UserAdminSchema>;

export type UserId = z.infer<typeof AdminsSchema.UserIdSchema>;
export type UserAdminUpdate = z.infer<typeof AdminsSchema.UserAdminUpdateSchema>;

export type UserIdListParams = z.infer<typeof AdminsSchema.UserIdListParamsSchema>;
export type UserIdList = z.infer<typeof AdminsSchema.UserIdListSchema>;
export type EmailAdmin = z.infer<typeof AdminsSchema.EmailAdminSchema>;
