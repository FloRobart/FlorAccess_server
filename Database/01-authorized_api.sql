-- authorizedapi table creation script
CREATE TABLE authorizedapi (
    api_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    api_name VARCHAR(255) NOT NULL,
    api_url VARCHAR(360) NOT NULL,
    api_privatetoken VARCHAR(512) UNIQUE,
    api_lastaccess BIGINT,
    api_status BOOLEAN DEFAULT TRUE,
    api_tokenvalidation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_api_name_url UNIQUE (api_name, api_url)
);
