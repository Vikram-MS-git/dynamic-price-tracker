import { query } from '../config/db.js';

export async function findByProductKey(userId, productKey) {
  const r = await query(`SELECT id, name FROM products WHERE user_id = $1 AND product_key = $2 LIMIT 1`, [userId, productKey]);
  return r.rows[0] ?? null;
}

export async function createProduct({ name, url, platform, category, groupId, userId, productKey, isDemo = false }) {
  const result = await query(
    `INSERT INTO products (name, url, platform, category, group_id, user_id, product_key, is_demo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, url, platform, category ?? null, groupId ?? null, userId, productKey, isDemo]
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

export async function deleteProduct(id, userId) {
  const result = await query(`DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id`, [id, userId]);
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

const PRODUCT_WITH_LATEST = `SELECT p.*,
            lp.price AS latest_price,
            lp.scraped_at AS last_scraped_at,
            lp.is_simulated AS latest_is_simulated,
            lp.simulation_label AS latest_simulation_label,
            p.last_scrape_error,
            pa.target_price AS alert_target_price,
            pa.is_triggered AS alert_is_triggered,
            pa.triggered_at AS alert_triggered_at
     FROM products p
     LEFT JOIN LATERAL (
       SELECT price, scraped_at, is_simulated, simulation_label
       FROM price_history
       WHERE product_id = p.id
       ORDER BY scraped_at DESC
       LIMIT 1
     ) lp ON true
     LEFT JOIN price_alerts pa ON pa.product_id = p.id AND pa.user_id = p.user_id`;

/** Products owned by one user. */
export async function getAllProducts(userId) {
  const result = await query(
    `${PRODUCT_WITH_LATEST} WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
    [userId]
  );
  return result.rows;
}

/** Every user's products. Only for the background scheduler. */
export async function getAllProductsForScheduler() {
  const result = await query(`${PRODUCT_WITH_LATEST} ORDER BY p.created_at DESC`);
  return result.rows;
}

export async function getProductById(id, userId) {
  const result = await query(
    `${PRODUCT_WITH_LATEST} WHERE p.id = $1 AND p.user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function deleteDemoProducts(userId) {
  const result = await query(
    `DELETE FROM products WHERE user_id = $1 AND is_demo = true RETURNING id`,
    [userId]
  );
  return result.rows;
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
    `SELECT id, product_id, price, currency, scraped_at, is_simulated, simulation_label
     FROM price_history
     WHERE ${conditions.join(' AND ')}
     ORDER BY scraped_at ASC`,
    params
  );
  return result.rows;
}

export async function insertPriceHistory({ productId, price, currency, scrapedAt, isSimulated = false, simulationLabel = null }) {
  const result = await query(
    `INSERT INTO price_history (product_id, price, currency, scraped_at, is_simulated, simulation_label)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [productId, price, currency, scrapedAt, Boolean(isSimulated), simulationLabel]
  );
  return result.rows[0];
}
