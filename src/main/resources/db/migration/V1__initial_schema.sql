CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(255) NOT NULL DEFAULT 'FARMER',
    preferred_language VARCHAR(255) NOT NULL DEFAULT 'en',
    preferred_crop VARCHAR(255) NOT NULL DEFAULT 'Tomato',
    created_at TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE TABLE farm_profiles (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    farm_name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    city VARCHAR(255),
    state VARCHAR(255),
    farm_size_acres DOUBLE PRECISION,
    crops TEXT,
    soil_type VARCHAR(255),
    irrigation_type VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_farm_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE detection_reports (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    farmer_id VARCHAR(255),
    crop_name VARCHAR(255),
    disease_name VARCHAR(255),
    confidence INTEGER,
    severity VARCHAR(255),
    yield_loss_estimate VARCHAR(255),
    language VARCHAR(255),
    organic_treatment TEXT,
    chemical_treatment TEXT,
    preventive_measures TEXT,
    best_time_to_treat VARCHAR(255),
    estimated_recovery_cost VARCHAR(255),
    urgency_level VARCHAR(255),
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    is_healthy BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE chat_history (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    question TEXT,
    answer TEXT,
    crop VARCHAR(255),
    language VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE user_activities (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    activity_type VARCHAR(255) NOT NULL,
    description TEXT,
    metadata TEXT,
    created_at TIMESTAMP
);

CREATE TABLE outbreak_alerts (
    id VARCHAR(255) PRIMARY KEY,
    disease VARCHAR(255),
    region VARCHAR(255),
    report_count INTEGER NOT NULL,
    first_reported_at TIMESTAMP,
    last_reported_at TIMESTAMP,
    severity VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP
);

CREATE TABLE password_reset_tokens (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(6) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
);
