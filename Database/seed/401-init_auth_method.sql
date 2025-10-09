-- ============================================
-- File: 401-init_auth_method.sql
-- Description: Initialize authentication methods available
-- Author: Floris Robart
-- ============================================



-- Insert default authentication methods if they do not exist
INSERT INTO auth_methods (id, method_name)
VALUES (1, 'code'), (2, 'password')
ON CONFLICT DO NOTHING;