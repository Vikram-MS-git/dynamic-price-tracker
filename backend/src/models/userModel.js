import { query } from '../config/db.js';

const PUBLIC = 'id, name, email, created_at';

export async function findByEmail(email) {
  const r = await query(`SELECT ${PUBLIC}, password_hash FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
  return r.rows[0] ?? null;
}

export async function findById(id) {
  const r = await query(`SELECT ${PUBLIC} FROM users WHERE id = $1`, [id]);
  return r.rows[0] ?? null;
}

export async function findByIdWithHash(id) {
  const r = await query(`SELECT ${PUBLIC}, password_hash FROM users WHERE id = $1`, [id]);
  return r.rows[0] ?? null;
}

export async function updateProfile(id, { name, email }) {
  const r = await query(
    `UPDATE users SET name = $2, email = $3, updated_at = NOW()
     WHERE id = $1 RETURNING ${PUBLIC}`,
    [id, name, email]
  );
  return r.rows[0] ?? null;
}

export async function setPasswordHash(id, hash) {
  await query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, [id, hash]);
}

export async function getStats(id) {
  const r = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM products WHERE user_id = $1) AS products,
       (SELECT COUNT(*)::int FROM product_groups WHERE user_id = $1) AS groups,
       (SELECT COUNT(*)::int FROM price_history ph
          JOIN products p ON p.id = ph.product_id WHERE p.user_id = $1) AS price_points`,
    [id]
  );
  return r.rows[0];
}
