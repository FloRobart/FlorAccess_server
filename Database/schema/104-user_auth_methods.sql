-- ============================================
-- File: 104-user_auth_methods.sql
-- Description: Create user_auth_methods table
-- Author: Floris Robart
-- ============================================


-- Table to link users and their authentication methods
CREATE TABLE user_auth_methods (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER NOT NULL,
    auth_method_id INTEGER NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_auth_methods_user_id_auth_method_id_key UNIQUE (user_id, auth_method_id),
    CONSTRAINT user_auth_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT user_auth_methods_auth_method_id_fkey FOREIGN KEY (auth_method_id) REFERENCES auth_methods(id) ON DELETE CASCADE
);
