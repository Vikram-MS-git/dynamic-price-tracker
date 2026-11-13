import { query } from '../config/db.js';

export async function createGroup({ name, category, userId }) {
  const result = await query(
    `INSERT INTO product_groups (name, category, user_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, category ?? null, userId]
  );
  return result.rows[0];
}

export async function findGroupByName(name, userId) {
  const result = await query(
    `SELECT * FROM product_groups WHERE LOWER(name) = LOWER($1) AND user_id = $2 LIMIT 1`,
    [name, userId]
  );
  return result.rows[0] ?? null;
}

export async function getGroupById(id, userId) {
  const result = await query(`SELECT * FROM product_groups WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rows[0] ?? null;
}

export async function getAllGroups(userId) {
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
                  'last_scraped_at', lp.scraped_at,
                  'is_simulated', lp.is_simulated,
                  'simulation_label', lp.simulation_label
                )
                ORDER BY p.platform
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS products
     FROM product_groups g
     LEFT JOIN products p ON p.group_id = g.id AND p.user_id = g.user_id
     LEFT JOIN LATERAL (
       SELECT price, scraped_at, is_simulated, simulation_label
       FROM price_history
       WHERE product_id = p.id
       ORDER BY scraped_at DESC
       LIMIT 1
     ) lp ON true
     WHERE g.user_id = $1
     GROUP BY g.id
     ORDER BY g.name ASC`,
    [userId]
  );
  return result.rows;
}

export async function getProductsInGroup(groupId, userId) {
  const result = userId
    ? await query(`SELECT * FROM products WHERE group_id = $1 AND user_id = $2 ORDER BY platform`, [groupId, userId])
    : await query(`SELECT * FROM products WHERE group_id = $1 ORDER BY platform`, [groupId]);
  return result.rows;
}

export async function updateGroup(id, userId, { name, category }) {
  const result = await query(
    `UPDATE product_groups SET name = COALESCE($3, name), category = COALESCE($4, category)
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, name ?? null, category ?? null]
  );
  return result.rows[0] ?? null;
}

export async function deleteGroup(id, userId) {
  // Sets group_id to null on products first, then deletes group
  await query(`UPDATE products SET group_id = NULL WHERE group_id = $1 AND user_id = $2`, [id, userId]);
  const result = await query(`DELETE FROM product_groups WHERE id = $1 AND user_id = $2 RETURNING id`, [id, userId]);
  return result.rows[0] ?? null;
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
    `SELECT id, product_id, price, currency, scraped_at, is_simulated, simulation_label
     FROM price_history
     WHERE ${conditions.join(' AND ')}
     ORDER BY scraped_at ASC`,
    params
  );
  return result.rows;
}
