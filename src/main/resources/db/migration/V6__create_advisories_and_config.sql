CREATE TABLE IF NOT EXISTS advisories (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    crop VARCHAR(100),
    region VARCHAR(100),
    author_id VARCHAR(255) REFERENCES users(id),
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_config (
    id VARCHAR(255) PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_config (id, config_key, config_value) VALUES 
('1', 'outbreak_threshold', '10'),
('2', 'alert_check_interval_minutes', '60'),
('3', 'max_daily_scans_per_user', '50')
ON CONFLICT (config_key) DO NOTHING;
