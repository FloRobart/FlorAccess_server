-- ============================================
-- File: 505-add_login_block_on_users.sql
-- Description: Add columns used to let a user block the logins on his account from the login code email
-- Author: Floris Robart
-- ============================================



-- Add login_block_token_hash and login_blocked_until columns to users table
-- login_block_token_hash : hash of the token carried by the block link of the last login code email
-- login_blocked_until : end of the block, the logins are blocked while this date is in the future (a date is used instead of a boolean so that the block ends by itself)
ALTER TABLE users
ADD COLUMN login_block_token_hash VARCHAR(1024),
ADD COLUMN login_blocked_until TIMESTAMPTZ;
