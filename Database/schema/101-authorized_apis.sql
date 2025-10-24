-- ============================================
-- File: 101-authorized_apis.sql
-- Description: Create authorized_apis table
-- Author: Floris Robart
-- ============================================



-- Table to store authorized APIs
CREATE TABLE authorized_apis (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    api_name VARCHAR(255) NOT NULL,
    api_url VARCHAR(360) NOT NULL,
    private_token_hash VARCHAR(512) UNIQUE,
    is_active BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT api_name_api_url_key UNIQUE (api_name, api_url)
);
