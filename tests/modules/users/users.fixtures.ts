import type { User } from "../../../src/modules/users/users.types";



/**
 * Builds a complete user for the tests.
 * The default user is connected, has no pending login code and is not blocked.
 * @param overrides Fields which replace the default ones
 * @returns User object
 */
export function buildUser(overrides: Partial<User> = {}): User {
    const oneHourAgo: Date = new Date(Date.now() - 60 * 60 * 1000);

    return {
        id: 1,
        email: "test1@test.fr",
        pseudo: "Pseudo",

        auth_methods_id: 1,
        is_connected: true,
        is_verified_email: true,
        last_logout_at: oneHourAgo,
        last_login: oneHourAgo,
        last_ip: null,

        email_verify_token_hash: null,
        secret_hash: null,
        token_hash: null,
        login_requested_at: null,
        login_code_attempts: 0,
        login_block_token_hash: null,
        login_blocked_until: null,

        is_admin: false,
        created_at: oneHourAgo,

        ...overrides,
    };
}
