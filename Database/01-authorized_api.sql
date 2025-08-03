-- authorizedapi table creation script
CREATE TABLE authorizedapi (
    api_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    api_name VARCHAR(255) NOT NULL,
    api_description TEXT,
    api_link VARCHAR(360) NOT NULL,
    api_token VARCHAR(512) UNIQUE,
    api_sequence INTEGER NOT NULL DEFAULT 0,
    api_tokenvalidation BOOLEAN DEFAULT FALSE,
    api_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
