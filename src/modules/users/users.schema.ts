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


/**
 * Schéma de validation pour la connexion d'un utilisateur.
 */
export const loginUserSchema = z.object({
    email: z.email(),
    code: z.string().min(6).max(6)
});