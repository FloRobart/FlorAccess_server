-- users table creation script
CREATE TABLE users (
    users_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    users_email VARCHAR(320) NOT NULL UNIQUE,
    users_name VARCHAR(255) NOT NULL,
    users_authmethod VARCHAR(255) DEFAULT null,

    users_connected BOOLEAN DEFAULT FALSE,
    users_lastlogin TIMESTAMPTZ,
    users_lastip VARCHAR(512),

    users_password VARCHAR(512),
    users_secret VARCHAR(512),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- Function to update the updated_at field
-- This function will be called by a trigger before each update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at field on update
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
