import { query } from '../config/db.js';

export async function getDashboardStats() {
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
       GROUP BY p.platform
       ORDER BY p.platform`
    ),
    query(`SELECT COUNT(*)::int AS total FROM price_history`),
    query(
      `SELECT DATE(scraped_at) AS day,
              COUNT(*)::int AS samples,
              ROUND(AVG(price)::numeric, 2) AS avg_price
       FROM price_history
       WHERE scraped_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(scraped_at)
       ORDER BY day ASC`
    ),
  ]);

  return {
    byPlatform: byPlatform.rows,
    totalPricePoints: pricePoints.rows[0]?.total ?? 0,
    dailyTrend: recentTrend.rows,
  };
}
