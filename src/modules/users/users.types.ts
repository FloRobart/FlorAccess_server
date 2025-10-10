import { UserAuthMethodSafe } from "./auth_methods.type";

/**
 * User interface representing the structure of a user in the database.
 */
export type User = {
    readonly id: number;
    email: string;
    pseudo: string;

    is_connected: boolean;
    is_verified_email: boolean;
    last_login: Date|null;
    last_ip: string|null;

    auth_methods?: string[];

    password_hash: string|null;
    secret_hash: string|null;

    readonly created_at: Date;
    readonly updated_at: Date;
}

/**
 * Safe version of the User interface without sensitive information.
 */
export type UserSafe = {
    readonly id: number;
    email: string;
    pseudo: string;

    is_connected: boolean;
    is_verified_email: boolean;
    last_login: Date;

    auth_methods?: UserAuthMethodSafe[];

    readonly created_at: Date;
    readonly updated_at: Date;
}

/**
 * Type for creating a new user.
 */
export type createUser = {
    email: string,
    pseudo: string
}