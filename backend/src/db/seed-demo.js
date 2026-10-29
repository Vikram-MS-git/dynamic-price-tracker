import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const MIN_ROWS = 15;
const DAYS = 14;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

async function seedDemo() {
  const { rows: products } = await pool.query('SELECT id, name, platform FROM products');

  if (!products.length) {
    console.log('No products found. Add products first, then run seed:demo.');
    await pool.end();
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const product of products) {
    const { rows: existing } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM price_history WHERE product_id = $1',
      [product.id]
    );

    if (existing[0].count >= MIN_ROWS) {
      console.log(`Skip product ${product.id} (${product.name}): already has ${existing[0].count} rows`);
      skipped += 1;
      continue;
    }

    const basePrice = randomBetween(500, 5000);
    const rowsToInsert = MIN_ROWS + Math.floor(Math.random() * (30 - MIN_ROWS + 1));
    const now = Date.now();

    for (let i = 0; i < rowsToInsert; i += 1) {
      const dayOffset = (i / rowsToInsert) * DAYS;
      const scrapedAt = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
      const variance = randomBetween(-0.15, 0.15);
      const price = Math.round(basePrice * (1 + variance) * 100) / 100;

      await pool.query(
        `INSERT INTO price_history (product_id, price, currency, scraped_at)
         VALUES ($1, $2, 'INR', $3)`,
        [product.id, price, scrapedAt.toISOString()]
      );
      inserted += 1;
    }

    console.log(`Seeded ${rowsToInsert} rows for product ${product.id} (${product.name})`);
  }

  console.log(`Done. Inserted ${inserted} rows, skipped ${skipped} product(s).`);
  await pool.end();
}

seedDemo().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
