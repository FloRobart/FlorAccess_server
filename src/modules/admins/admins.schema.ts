import { z } from "zod";
import { UserSafeSchema } from "../users/users.schema";



/*========*/
/* SELECT */
/*========*/
/**
 * Schéma de validation pour un utilisateur presque complet (uniquement pour les admins).
 */
export const UserAdminSchema = UserSafeSchema.extend({
    last_login: z.date(),
    last_ip: z.ipv4().or(z.ipv6()).nullable(),
    updated_at: z.date(),
});


/*========*/
/* UPDATE */
/*========*/
/**
 * Schéma de validation pour la mise à jour d'un utilisateur par un administrateur.
 */
export const UserIdSchema = z.object({
    userId: z.coerce.number().int().positive(),
});

/**
 * Schéma de validation pour la mise à jour d'un utilisateur par un administrateur.
 */
export const UserAdminUpdateSchema = UserAdminSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    last_ip: true,
    last_login: true,
    last_logout_at: true,
}).partial();