import { z } from "zod";



/*========*/
/* SELECT */
/*========*/
/**
 * Schéma de validation pour la table auth_methods.
 */
export const AuthMethodSchema = z.object({
    id: z.number(),
    immuable_method_name: z.string(),
    display_name: z.string(),

    created_at: z.date(),
    updated_at: z.date()
});

/**
 * Schéma de validation pour la table user_auth_methods sans informations sensibles.
 */
export const UserAuthMethodSafeSchema = z.object({
    id: z.number(),
    user_id: z.number(),
    auth_method_id: z.number(),

    created_at: z.date(),
    updated_at: z.date()
});

/**
 * Schéma de validation pour la table user_auth_methods.
 */
export const UserAuthMethodSchema = z.object({
    ...UserAuthMethodSafeSchema.shape,
    is_validated: z.boolean(),
});