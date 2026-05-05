CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_report_user ON detection_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_farmer ON detection_reports(farmer_id);
CREATE INDEX IF NOT EXISTS idx_report_created ON detection_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_history(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_farm_user ON farm_profiles(user_id);
