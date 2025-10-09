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

    password_hash: string|null;
    secret_hash: string|null;

    readonly created_at: Date;
    readonly updated_at: Date|null;
}

export type createUserType = {
    email: string,
    pseudo: string
}