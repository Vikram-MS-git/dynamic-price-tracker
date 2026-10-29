ALTER TABLE products
  ADD COLUMN IF NOT EXISTS last_scrape_error TEXT;
