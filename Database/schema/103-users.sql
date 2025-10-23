-- ============================================
-- File: 102-users.sql
-- Description: Create users table
-- Author: Floris Robart
-- ============================================



-- Table to store user information
CREATE TABLE users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(320) NOT NULL,
    pseudo VARCHAR(255) NOT NULL,

    auth_methods_id INTEGER NOT NULL,
    is_connected BOOLEAN DEFAULT TRUE,
    is_verified_email BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_ip VARCHAR(512),

    email_verify_token_hash VARCHAR(512),
    secret_hash VARCHAR(512),
    token_hash VARCHAR(512),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT auth_methods_id_fkey FOREIGN KEY (auth_methods_id) REFERENCES auth_methods(id) ON DELETE RESTRICT
);
