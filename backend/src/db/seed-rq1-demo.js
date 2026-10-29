/**
 * Creates 3 product groups (Amazon + Flipkart each) with demo price history for RQ1 compare.
 * Placeholder URLs — use seed:demo for charts; live scrape optional.
 */
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const DEMO_GROUPS = [
  {
    name: 'Wireless Earbuds',
    category: 'Electronics',
    amazonBase: 2499,
    flipkartBase: 2299,
  },
  {
    name: 'Phone Case',
    category: 'Accessories',
    amazonBase: 399,
    flipkartBase: 349,
  },
  {
    name: 'Power Bank 10000mAh',
    category: 'Electronics',
    amazonBase: 899,
    flipkartBase: 799,
  },
];

const MIN_ROWS = 20;
const DAYS = 14;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

async function findOrCreateGroup(name, category) {
  const existing = await pool.query(
    `SELECT id FROM product_groups WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await pool.query(
    `INSERT INTO product_groups (name, category) VALUES ($1, $2) RETURNING id`,
    [name, category]
  );
  return created.rows[0].id;
}

async function findProduct(groupId, platform) {
  const result = await pool.query(
    `SELECT id FROM products WHERE group_id = $1 AND platform = $2 LIMIT 1`,
    [groupId, platform]
  );
  return result.rows[0]?.id ?? null;
}

async function createProduct(groupId, name, platform, category) {
  const url =
    platform === 'amazon'
      ? `https://www.amazon.in/dp/demo-${groupId}`
      : `https://www.flipkart.com/demo-p-${groupId}`;
  const result = await pool.query(
    `INSERT INTO products (name, url, platform, category, group_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [`${name} (${platform})`, url, platform, category, groupId]
  );
  return result.rows[0].id;
}

async function seedPrices(productId, basePrice) {
  const { rows: existing } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM price_history WHERE product_id = $1',
    [productId]
  );
  if (existing[0].count >= MIN_ROWS) {
    return 0;
  }

  const now = Date.now();
  let inserted = 0;
  for (let i = 0; i < MIN_ROWS; i += 1) {
    const dayOffset = (i / MIN_ROWS) * DAYS;
    const scrapedAt = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
    const variance = randomBetween(-0.12, 0.12);
    const price = Math.round(basePrice * (1 + variance) * 100) / 100;
    await pool.query(
      `INSERT INTO price_history (product_id, price, currency, scraped_at)
       VALUES ($1, $2, 'INR', $3)`,
      [productId, price, scrapedAt.toISOString()]
    );
    inserted += 1;
  }
  return inserted;
}

async function main() {
  let productsCreated = 0;
  let pricesInserted = 0;

  for (const item of DEMO_GROUPS) {
    const groupId = await findOrCreateGroup(item.name, item.category);

    for (const platform of ['amazon', 'flipkart']) {
      let productId = await findProduct(groupId, platform);
      if (!productId) {
        productId = await createProduct(groupId, item.name, platform, item.category);
        productsCreated += 1;
        console.log(`Created ${platform} product for "${item.name}" (id ${productId})`);
      }

      const base = platform === 'amazon' ? item.amazonBase : item.flipkartBase;
      const n = await seedPrices(productId, base);
      pricesInserted += n;
      if (n) console.log(`  Seeded ${n} prices for ${platform} (base ₹${base})`);
    }
  }

  console.log(
    `\nRQ1 demo ready: ${DEMO_GROUPS.length} groups, ${productsCreated} new product(s), ${pricesInserted} price rows inserted.`
  );
  console.log('Open http://localhost:5173/compare to view cross-platform charts.');
  await pool.end();
}

main().catch((err) => {
  console.error('seed-rq1-demo failed:', err.message);
  process.exit(1);
});
