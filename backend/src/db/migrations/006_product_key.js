import { legacyProductKey } from '../../services/urlSafety.js';

/**
 * Adds products.product_key (stable identity of a store listing) and a unique index per user
 * so the same product cannot be tracked twice.
 *
 * Existing rows are backfilled. If a user already tracks the same product more than once, the
 * OLDEST row keeps the key and the extra rows keep product_key = NULL: nothing is deleted or
 * merged automatically; the extras are listed in the console so the owner can remove them.
 */
export async function up(client) {
  await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS product_key TEXT');

  const { rows } = await client.query(
    'SELECT id, user_id, url, platform FROM products WHERE product_key IS NULL ORDER BY created_at, id'
  );
  const taken = await client.query('SELECT user_id, product_key, id FROM products WHERE product_key IS NOT NULL');
  const owner = new Map(taken.rows.map((r) => [`${r.user_id ?? 'none'}|${r.product_key}`, r.id]));

  const duplicates = [];
  for (const row of rows) {
    const key = legacyProductKey(row.url, row.platform);
    if (!key) continue;
    const scope = `${row.user_id ?? 'none'}|${key}`;
    if (owner.has(scope)) {
      duplicates.push({ id: row.id, duplicateOf: owner.get(scope), url: row.url });
      continue;
    }
    owner.set(scope, row.id);
    await client.query('UPDATE products SET product_key = $2 WHERE id = $1', [row.id, key]);
  }

  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_user_product_key
    ON products (user_id, product_key) WHERE product_key IS NOT NULL AND user_id IS NOT NULL`);

  if (duplicates.length) {
    console.warn(`\n[migration 006] ${duplicates.length} duplicate product row(s) were left untouched (product_key = NULL). Review and delete them in the app if you do not need them:`);
    duplicates.forEach((d) => console.warn(`  product #${d.id} duplicates #${d.duplicateOf}  ${d.url}`));
  }
}
