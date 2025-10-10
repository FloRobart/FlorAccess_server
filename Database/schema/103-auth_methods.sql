-- ============================================
-- File: 103-auth_methods.sql
-- Description: Create auth_methods table
-- Author: Floris Robart
-- ============================================



-- Table to store authentication methods
CREATE TABLE auth_methods (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    immuable_method_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT auth_methods_immuable_method_name_key UNIQUE (immuable_method_name)
);
