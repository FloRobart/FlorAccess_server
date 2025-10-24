import { z } from "zod";
import AppConfig from "../../config/AppConfig";



/**
 * Schéma de validation pour un email, avec prétraitement pour normaliser l'email.
 */
const EmailSchema = z.preprocess(
    (val) => typeof val === "string" ? val.toLowerCase().replace(/\s+/g, "") : val,
    z.email()
);

/**
 * Schéma de validation pour un pseudo.
 */
const PseudoSchema = z.string().trim().min(3).max(255);


/*========*/
/* INSERT */
/*========*/
/**
 * Schéma de validation pour l'insertion d'un utilisateur.
 */
export const UserInsertSchema = z.object({
    email: EmailSchema,
    pseudo: PseudoSchema,
});


/*========*/
/* SELECT */
/*========*/
/**
 * Schéma de validation pour un utilisateur "safe" (sans informations sensibles).
 */
export const UserSafeSchema = z.object({
    id: z.int().min(1),
    email: EmailSchema,
    pseudo: PseudoSchema,

    auth_methods_id: z.int().min(1),
    is_connected: z.boolean(),
    is_verified_email: z.boolean(),
    last_login: z.date(),

    created_at: z.date(),
    updated_at: z.date(),
});

/**
 * Schéma de validation pour un utilisateur complet (avec informations sensibles).
 */
export const UserSchema = UserSafeSchema.extend({
    last_ip: z.ipv4().or(z.ipv6()).nullable(),

    email_verify_token_hash: z.string().trim().nullable(),
    secret_hash: z.string().trim().nullable(),
    token_hash: z.string().trim().nullable(),
});

/**
 * Schéma de validation pour une adresse IP (IPv4 ou IPv6).
 */
export const IPAddressSchema = z.ipv4().or(z.ipv6());

/**
 * Schéma de validation pour l'en-tête 'Authorization' contenant un JWT.
 * Le format attendu est 'Bearer <token>'.
 */
export const AuthorizationHeaderSchema = z.string().trim().regex(/^Bearer\s[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/);


/*========*/
/* UPDATE */
/*========*/
/**
 * Schéma de validation pour la mise à jour d'un utilisateur.
 */
export const UserUpdateSchema = z.object({
    email: EmailSchema,
    pseudo: PseudoSchema,
});


/*=======*/
/* LOGIN */
/*=======*/
/**
 * Schéma de validation pour la requête de login d'un utilisateur.
 */
export const UserLoginRequestSchema = z.object({
    email: EmailSchema,
});

/**
 * Schéma de validation pour la confirmation de login d'un utilisateur.
 */
export const UserLoginConfirmSchema = z.object({
    email: EmailSchema,
    token: z.string().trim().min(1),
    secret: z.string().trim().min(1),
    ip: IPAddressSchema.optional().nullable(),
}).transform((data) => ({
    email: data.email,
    token: data.token,
    secret: data.secret,
    ip: data.ip || null,
}));


/*====================*/
/* Email verification */
/*====================*/
/**
 * Schéma de validation pour la vérification d'email d'un utilisateur.
 */
export const UserEmailVerificationSchema = z.object({
    userId: z.string()
        .trim()
        .regex(/^[0-9]+$/)
        .refine((val) => {
            const n = Number(val);
            return Number.isInteger(n) && n > 0;
        }),
    token: z.string()
        .trim()
        .regex(/^[0-9a-f]+$/),
});