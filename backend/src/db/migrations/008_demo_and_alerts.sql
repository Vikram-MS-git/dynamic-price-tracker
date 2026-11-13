-- Migration 008: Add demo/simulated flags and server-side price alerts
-- Safe and idempotent: preserves all existing rows and tables

-- 1. Simulated price tracking
ALTER TABLE price_history
  ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS simulation_label VARCHAR(50);

-- 2. Product demo & status metadata
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) NOT NULL DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS target_price DECIMAL(12, 2);

-- 3. Server-side price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price DECIMAL(12, 2) NOT NULL,
  is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_product_alert UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON price_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON price_alerts (product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_simulated ON price_history (is_simulated);
