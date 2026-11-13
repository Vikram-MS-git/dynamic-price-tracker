-- Migration 009: Add PC Builds table for saved custom computer configurations
CREATE TABLE IF NOT EXISTS pc_builds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  use_case VARCHAR(50),
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estimated_wattage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pc_builds_user_id ON pc_builds (user_id);
