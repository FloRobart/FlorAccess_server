/**
 * User interface representing the structure of a user in the database.
 */
export type User = {
    readonly users_id: number;
    users_email: string;
    users_name: string;
    users_authmethod: string|null;

    users_connected: boolean;

    users_password: string|null;
    users_secret: string|null;
    users_ip: string|null;

    readonly createdAt: Date;
    updatedAt: Date|null;
}