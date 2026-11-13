import { query } from '../config/db.js';

export async function getUserAlerts(userId) {
  const result = await query(
    `SELECT pa.*,
            p.name AS product_name,
            p.url AS product_url,
            p.platform AS product_platform,
            p.category AS product_category,
            p.image_url AS product_image_url,
            p.is_demo AS product_is_demo,
            lp.price AS latest_price,
            lp.scraped_at AS last_scraped_at,
            lp.is_simulated AS latest_is_simulated
     FROM price_alerts pa
     JOIN products p ON p.id = pa.product_id
     LEFT JOIN LATERAL (
       SELECT price, scraped_at, is_simulated
       FROM price_history
       WHERE product_id = p.id
       ORDER BY scraped_at DESC
       LIMIT 1
     ) lp ON true
     WHERE pa.user_id = $1
     ORDER BY pa.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getAlertByProductId(userId, productId) {
  const result = await query(
    `SELECT * FROM price_alerts WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return result.rows[0] ?? null;
}

export async function upsertAlert(userId, productId, targetPrice) {
  const result = await query(
    `INSERT INTO price_alerts (user_id, product_id, target_price, is_triggered, updated_at)
     VALUES ($1, $2, $3, false, NOW())
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET target_price = EXCLUDED.target_price,
                   is_triggered = false,
                   triggered_at = NULL,
                   updated_at = NOW()
     RETURNING *`,
    [userId, productId, targetPrice]
  );
  return result.rows[0];
}

export async function deleteAlert(userId, productId) {
  const result = await query(
    `DELETE FROM price_alerts WHERE user_id = $1 AND product_id = $2 RETURNING id`,
    [userId, productId]
  );
  return result.rows[0] ?? null;
}

export async function checkAndTriggerAlert(userId, productId, currentPrice) {
  const numPrice = Number(currentPrice);
  if (!Number.isFinite(numPrice) || numPrice <= 0) return null;

  const alert = await getAlertByProductId(userId, productId);
  if (!alert) return null;

  if (numPrice <= Number(alert.target_price)) {
    const updated = await query(
      `UPDATE price_alerts
       SET is_triggered = true,
           triggered_at = COALESCE(triggered_at, NOW()),
           updated_at = NOW()
       WHERE user_id = $1 AND product_id = $2
       RETURNING *`,
      [userId, productId]
    );
    return { ...updated.rows[0], justTriggered: !alert.is_triggered };
  } else if (alert.is_triggered) {
    // Price went back above target: reset triggered status
    const reset = await query(
      `UPDATE price_alerts
       SET is_triggered = false,
           triggered_at = NULL,
           updated_at = NOW()
       WHERE user_id = $1 AND product_id = $2
       RETURNING *`,
      [userId, productId]
    );
    return { ...reset.rows[0], justTriggered: false };
  }

  return { ...alert, justTriggered: false };
}
