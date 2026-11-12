import { query } from '../config/db.js';

export async function getDashboardStats(userId) {
  const [byPlatform, pricePoints, recentTrend] = await Promise.all([
    query(
      `SELECT p.platform,
              COUNT(DISTINCT p.id)::int AS product_count,
              ROUND(AVG(lp.price)::numeric, 2) AS avg_latest_price,
              MIN(lp.price) AS min_latest,
              MAX(lp.price) AS max_latest
       FROM products p
       LEFT JOIN LATERAL (
         SELECT price FROM price_history
         WHERE product_id = p.id
         ORDER BY scraped_at DESC LIMIT 1
       ) lp ON true
       WHERE p.user_id = $1
       GROUP BY p.platform
       ORDER BY p.platform`,
      [userId]
    ),
    query(
      `SELECT COUNT(*)::int AS total
       FROM price_history ph
       JOIN products p ON p.id = ph.product_id
       WHERE p.user_id = $1`,
      [userId]
    ),
    query(
      `SELECT DATE(ph.scraped_at) AS day,
              COUNT(*)::int AS samples,
              ROUND(AVG(ph.price)::numeric, 2) AS avg_price
       FROM price_history ph
       JOIN products p ON p.id = ph.product_id
       WHERE p.user_id = $1 AND ph.scraped_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(ph.scraped_at)
       ORDER BY day ASC`,
      [userId]
    ),
  ]);

  return {
    byPlatform: byPlatform.rows,
    totalPricePoints: pricePoints.rows[0]?.total ?? 0,
    dailyTrend: recentTrend.rows,
  };
}
