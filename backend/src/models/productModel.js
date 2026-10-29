import { query } from '../config/db.js';

export async function createProduct({ name, url, platform, category, groupId }) {
  const result = await query(
    `INSERT INTO products (name, url, platform, category, group_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, url, platform, category ?? null, groupId ?? null]
  );
  return result.rows[0];
}

export async function updateProductGroup(productId, groupId) {
  const result = await query(
    `UPDATE products SET group_id = $2 WHERE id = $1 RETURNING *`,
    [productId, groupId]
  );
  return result.rows[0] ?? null;
}

export async function deleteProduct(id) {
  const result = await query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0] ?? null;
}

export async function setScrapeError(productId, message) {
  await query(`UPDATE products SET last_scrape_error = $2 WHERE id = $1`, [
    productId,
    message ?? null,
  ]);
}

export async function clearScrapeError(productId) {
  await setScrapeError(productId, null);
}

export async function updateProductImage(productId, imageUrl) {
  if (!imageUrl) return;
  await query(`UPDATE products SET image_url = $2 WHERE id = $1`, [productId, imageUrl]);
}

export async function getAllProducts() {
  const result = await query(
    `SELECT p.*,
            lp.price AS latest_price,
            lp.scraped_at AS last_scraped_at,
            p.last_scrape_error
     FROM products p
     LEFT JOIN LATERAL (
       SELECT price, scraped_at
       FROM price_history
       WHERE product_id = p.id
       ORDER BY scraped_at DESC
       LIMIT 1
     ) lp ON true
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

export async function getProductById(id) {
  const result = await query(`SELECT * FROM products WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function getPriceHistory(productId, { from, to } = {}) {
  const conditions = ['product_id = $1'];
  const params = [productId];
  let paramIndex = 2;

  if (from) {
    conditions.push(`scraped_at >= $${paramIndex++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`scraped_at <= $${paramIndex++}`);
    params.push(to);
  }

  const result = await query(
    `SELECT id, product_id, price, currency, scraped_at
     FROM price_history
     WHERE ${conditions.join(' AND ')}
     ORDER BY scraped_at ASC`,
    params
  );
  return result.rows;
}

export async function insertPriceHistory({ productId, price, currency, scrapedAt }) {
  const result = await query(
    `INSERT INTO price_history (product_id, price, currency, scraped_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [productId, price, currency, scrapedAt]
  );
  return result.rows[0];
}
