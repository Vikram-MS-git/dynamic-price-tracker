import { query } from '../config/db.js';

const PUBLIC = 'id, name, email, created_at';
const WITH_TV = `${PUBLIC}, token_version`;

export async function findByEmail(email) {
  const r = await query(`SELECT ${WITH_TV}, password_hash FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
  return r.rows[0] ?? null;
}

export async function findById(id) {
  const r = await query(`SELECT ${PUBLIC} FROM users WHERE id = $1`, [id]);
  return r.rows[0] ?? null;
}

/** For request authentication: includes token_version (never sent to clients). */
export async function findAuthById(id) {
  const r = await query(`SELECT ${WITH_TV} FROM users WHERE id = $1`, [id]);
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

/** Sets a new password and bumps token_version so all older tokens stop working. */
export async function setPasswordHash(id, hash) {
  const r = await query(
    `UPDATE users SET password_hash = $2, token_version = token_version + 1, updated_at = NOW()
     WHERE id = $1 RETURNING token_version`,
    [id, hash]
  );
  return r.rows[0].token_version;
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
