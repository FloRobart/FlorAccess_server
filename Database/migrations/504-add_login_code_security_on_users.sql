-- ============================================
-- File: 504-add_login_code_security_on_users.sql
-- Description: Add columns used to expire and to limit the attempts on the login code
-- Author: Floris Robart
-- ============================================



-- Add login_requested_at and login_code_attempts columns to users table
-- login_requested_at : date of the last login code sent, used server side for the expiration and for the cooldown between two requests
-- login_code_attempts : number of confirmations already tried on the current login code
ALTER TABLE users
ADD COLUMN login_requested_at TIMESTAMPTZ,
ADD COLUMN login_code_attempts INTEGER NOT NULL DEFAULT 0;
