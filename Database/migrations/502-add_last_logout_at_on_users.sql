-- ============================================
-- File: 502-add_last_logout_at_on_users.sql
-- Description: Add column last_logout_at to the users table
-- Author: Floris Robart
-- ============================================



-- Add last_logout_at column to users table
ALTER TABLE users
ADD COLUMN last_logout_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
