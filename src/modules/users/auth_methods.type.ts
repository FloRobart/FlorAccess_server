export type AuthMethod = {
    id: number;
    immuable_method_name: string;
    display_name: string;

    readonly created_at: Date;
    readonly updated_at: Date;
}


export type UserAuthMethodSafe = {
    id: number;
    user_id: number;
    auth_method_id: number;

    readonly created_at: Date;
    readonly updated_at: Date;
}

export type UserAuthMethod = {
    id: number;
    user_id: number;
    auth_method_id: number;
    is_validated: boolean;

    readonly created_at: Date;
    readonly updated_at: Date;
}