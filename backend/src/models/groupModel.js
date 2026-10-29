import { query } from '../config/db.js';

export async function createGroup({ name, category }) {
  const result = await query(
    `INSERT INTO product_groups (name, category)
     VALUES ($1, $2)
     RETURNING *`,
    [name, category ?? null]
  );
  return result.rows[0];
}

export async function findGroupByName(name) {
  const result = await query(
    `SELECT * FROM product_groups WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  return result.rows[0] ?? null;
}

export async function getGroupById(id) {
  const result = await query(`SELECT * FROM product_groups WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function getAllGroups() {
  const result = await query(
    `SELECT g.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', p.id,
                  'name', p.name,
                  'url', p.url,
                  'platform', p.platform,
                  'category', p.category,
                  'image_url', p.image_url,
                  'latest_price', lp.price,
                  'last_scraped_at', lp.scraped_at
                )
                ORDER BY p.platform
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS products
     FROM product_groups g
     LEFT JOIN products p ON p.group_id = g.id
     LEFT JOIN LATERAL (
       SELECT price, scraped_at
       FROM price_history
       WHERE product_id = p.id
       ORDER BY scraped_at DESC
       LIMIT 1
     ) lp ON true
     GROUP BY g.id
     ORDER BY g.name ASC`
  );
  return result.rows;
}

export async function getProductsInGroup(groupId) {
  const result = await query(
    `SELECT * FROM products WHERE group_id = $1 ORDER BY platform`,
    [groupId]
  );
  return result.rows;
}

export async function getPriceHistoryForProducts(productIds, { from, to } = {}) {
  if (!productIds.length) return [];

  const conditions = [`product_id = ANY($1::int[])`];
  const params = [productIds];
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
