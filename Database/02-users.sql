-- users table creation script
CREATE TABLE users (
    users_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    users_email VARCHAR(320) NOT NULL UNIQUE,
    users_name VARCHAR(255) NOT NULL,
    users_password VARCHAR(255),
    users_token VARCHAR(510),
    users_ip VARCHAR(45),
    users_authmode VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (users_email, users_token)
);
