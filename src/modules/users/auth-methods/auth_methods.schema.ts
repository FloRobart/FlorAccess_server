import { z } from "zod";



/*========*/
/* SELECT */
/*========*/
/**
 * Schéma de validation pour la table auth_methods.
 */
export const AuthMethodSchema = z.object({
    id: z.int().min(1),
    immuable_method_name: z.string().trim().toUpperCase().min(1),
    display_name: z.string().trim().min(1),

    created_at: z.date(),
    updated_at: z.date()
});
