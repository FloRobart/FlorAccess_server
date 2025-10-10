import { z } from "zod";



/**
 * Schéma de validation pour la création d'un utilisateur.
 */
export const createUserSchema = z.object({
    email: z.preprocess(
        (val) => typeof val === "string" ? val.toLowerCase().replace(/\s+/g, "") : val,
        z.email()
    ),
    pseudo: z.string().min(3).max(255)
}).transform((data) => ({
    email: data.email,
    pseudo: data.pseudo.trim()
}));

export const UserAuthMethodSafeSchema = z.object({
    id: z.number(),
    user_id: z.number(),
    auth_method_id: z.number(),

    created_at: z.date(),
    updated_at: z.date()
});

/**
 * Schéma de validation pour un utilisateur "safe" (sans informations sensibles).
 */
export const UserSafeSchema = z.object({
    id: z.number(),
    email: z.email(),
    pseudo: z.string().min(3).max(255),

    is_connected: z.boolean(),
    is_verified_email: z.boolean(),
    last_login: z.date(),

    auth_methods: z.array(UserAuthMethodSafeSchema).optional(),

    created_at: z.date(),
    updated_at: z.date()
});

export const AuthMethodSchema = z.object({
    id: z.number(),
    immuable_method_name: z.string(),
    display_name: z.string(),

    created_at: z.date(),
    updated_at: z.date()
})