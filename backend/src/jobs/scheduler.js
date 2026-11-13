import cron from 'node-cron';
import * as productModel from '../models/productModel.js';
import { scrapeAndStore } from '../services/productService.js';
import { tryAcquire, release, anyHeld, isHeld } from '../services/scrapeLock.js';
import { HttpError } from '../utils/httpError.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Pause between products so we do not hammer the stores (set SCRAPE_DELAY_MS=0 to disable).
const delayMs = () => Math.max(0, Number(process.env.SCRAPE_DELAY_MS ?? 1500));

export function startScheduler() {
  const schedule = process.env.SCRAPE_CRON || '0 */6 * * *';

  if (!cron.validate(schedule)) {
    console.warn(`Invalid SCRAPE_CRON "${schedule}", using default 0 */6 * * *`);
  }

  const validSchedule = cron.validate(schedule) ? schedule : '0 */6 * * *';

  cron.schedule(validSchedule, async () => {
    if (anyHeld()) {
      console.warn('[scheduler] Skipping this run: another scrape is still in progress');
      return;
    }
    console.log(`[scheduler] Running scrape job at ${new Date().toISOString()}`);
    try {
      await runScrapeJob();
    } catch (err) {
      console.error('[scheduler] Job failed:', err.message);
    }
  });

  console.log(`[scheduler] Started with cron: ${validSchedule}`);
}

/** Scrape one user's products, or everyone's when no userId is given (cron). */
export async function runScrapeJob({ userId } = {}) {
  const lockKey = userId ? `user:${userId}` : 'all';
  if (isHeld('all') || isHeld(lockKey)) {
    throw new HttpError(409, 'A price update is already running. Please wait for it to finish.');
  }
  tryAcquire(lockKey);
  try {
    return await scrapeAll(userId);
  } finally {
    release(lockKey);
  }
}

async function scrapeAll(userId) {
  const products = userId
    ? await productModel.getAllProducts(userId)
    : await productModel.getAllProductsForScheduler();
  const results = [];
  let scraped = 0;
  let failed = 0;

  for (const [index, product] of products.entries()) {
    if (index > 0 && delayMs()) await sleep(delayMs() * (0.75 + Math.random() * 0.5));
    try {
      const row = await scrapeAndStore(product);
      scraped += 1;
      results.push({
        productId: product.id,
        name: product.name,
        platform: product.platform,
        success: true,
        price: row.price,
        scrapedAt: row.scraped_at,
      });
      console.log(
        `[scheduler] ${product.name} (${product.platform}): ₹${row.price} @ ${row.scraped_at}`
      );
    } catch (err) {
      await productModel.setScrapeError(product.id, err.message);
      failed += 1;
      results.push({
        productId: product.id,
        name: product.name,
        platform: product.platform,
        success: false,
        error: err.message,
      });
      console.error(
        `[scheduler] Failed for product ${product.id} (${product.name}):`,
        err.message
      );
    }
  }

  return { scraped, failed, total: products.length, results };
}
