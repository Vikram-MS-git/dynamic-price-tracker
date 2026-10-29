CREATE TABLE IF NOT EXISTS product_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES product_groups(id);

CREATE INDEX IF NOT EXISTS idx_products_group_id ON products (group_id);

-- Backfill groups for existing products (same name = one group)
DO $$
DECLARE
  r RECORD;
  gid INTEGER;
BEGIN
  FOR r IN
    SELECT DISTINCT name, category
    FROM products
    WHERE group_id IS NULL
  LOOP
    INSERT INTO product_groups (name, category)
    VALUES (r.name, r.category)
    RETURNING id INTO gid;
    UPDATE products SET group_id = gid WHERE name = r.name AND group_id IS NULL;
  END LOOP;
END $$;
