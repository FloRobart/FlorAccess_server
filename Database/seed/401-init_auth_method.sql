-- ============================================
-- File: 401-init_auth_method.sql
-- Description: Initialize authentication methods available
-- Author: Floris Robart
-- ============================================



-- Insert default authentication methods if they do not exist
INSERT INTO auth_methods (immuable_method_name, display_name)
VALUES ('PASSWORD', 'Password'), ('EMAIL_CODE', 'Code')
ON CONFLICT DO NOTHING;