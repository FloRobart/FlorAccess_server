-- ============================================
-- File: 201-update_users_updated_at.sql
-- Description: Triggers to update updated_at columns on row updates
-- Author: Floris Robart
-- ============================================



-- Trigger on the authorized_apis table to update the updated_at column on row updates
DROP TRIGGER IF EXISTS update_authorized_apis_updated_at ON authorized_apis;
CREATE TRIGGER update_authorized_apis_updated_at
BEFORE UPDATE ON authorized_apis
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger on the users table to update the updated_at column on row updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger on the auth_methods table to update the updated_at column on row updates
DROP TRIGGER IF EXISTS update_auth_methods_updated_at ON auth_methods;
CREATE TRIGGER update_auth_methods_updated_at
BEFORE UPDATE ON auth_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();