import { z } from "zod";
import { UserAuthMethodSafeSchema } from "./auth-methods/auth_methods.schema";



/*========*/
/* INSERT */
/*========*/
/**
 * Schéma de validation pour l'insertion d'un utilisateur.
 */
export const InsertUserSchema = z.object({
    email: z.preprocess(
        (val) => typeof val === "string" ? val.toLowerCase().replace(/\s+/g, "") : val,
        z.email()
    ),
    pseudo: z.string().min(3).max(255)
}).transform((data) => ({
    email: data.email,
    pseudo: data.pseudo.trim()
}));


/*========*/
/* SELECT */
/*========*/
/**
 * Schéma de validation pour un utilisateur "safe" (sans informations sensibles).
 */
export const UserSafeSchema = z.object({
    id: z.number(),
    email: z.email(),
    pseudo: z.string().min(3).max(255),

    auth_methods_id: z.number(),
    is_connected: z.boolean(),
    is_verified_email: z.boolean(),
    last_login: z.date(),

    created_at: z.date(),
    updated_at: z.date()
});

/**
 * Schéma de validation pour un utilisateur complet (avec informations sensibles).
 */
export const UserSchema = z.object({
    ...UserSafeSchema.shape,

    last_ip: z.ipv4().or(z.ipv6()).nullable(),

    password_hash: z.string().nullable(),
    secret_hash: z.string().nullable(),
    token_hash: z.string().nullable()
});

/**
 * Schéma de validation pour une adresse IP (IPv4 ou IPv6).
 */
export const IPAddressSchema = z.ipv4().or(z.ipv6());

/**
 * Schéma de validation pour l'en-tête 'Authorization' contenant un JWT.
 * Le format attendu est 'Bearer <token>'.
 */
export const AuthorizationHeaderSchema = z.string().regex(/^Bearer\s[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/);


/*========*/
/* UPDATE */
/*========*/
export const UpdateUserSchema = z.object({
    email: z.preprocess(
        (val) => typeof val === "string" ? val.toLowerCase().replace(/\s+/g, "") : val,
        z.email()
    ),
    pseudo: z.string().min(3).max(255)
}).transform((data) => ({
    email: data.email,
    pseudo: data.pseudo.trim()
}));


/*=======*/
/* LOGIN */
/*=======*/
export const UserLoginRequestSchema = z.object({
    email: z.preprocess(
        (val) => typeof val === "string" ? val.toLowerCase().replace(/\s+/g, "") : val,
        z.email()
    )
}).transform((data) => ( data.email ));