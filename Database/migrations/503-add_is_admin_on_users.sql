-- ============================================
-- File: 503-add_is_admin_on_users.sql
-- Description: Add column is_admin to the users table
-- Author: Floris Robart
-- ============================================



-- Add is_admin column to users table
ALTER TABLE users
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;