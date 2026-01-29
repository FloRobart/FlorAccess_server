import { z } from "zod";
import { UserSafeSchema } from "../users/users.schema";



/**
 * Schéma de validation pour un utilisateur complet (avec informations sensibles).
 */
export const UserAdminSchema = UserSafeSchema.extend({
    last_login: z.date(),
    last_ip: z.ipv4().or(z.ipv6()).nullable(),
    updated_at: z.date(),
});