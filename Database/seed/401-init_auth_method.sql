-- ============================================
-- File: 401-init_auth_method.sql
-- Description: Initialize authentication methods available
-- Author: Floris Robart
-- ============================================



-- Insert default authentication methods if they do not exist
INSERT INTO auth_methods (immuable_method_name, display_name)
VALUES ('EMAIL_CODE', 'Code'), ('PASSWORD', 'Password')
ON CONFLICT DO NOTHING;