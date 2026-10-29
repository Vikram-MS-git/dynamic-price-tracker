import cron from 'node-cron';
import * as productModel from '../models/productModel.js';
import { scrapeAndStore } from '../services/productService.js';

export function startScheduler() {
  const schedule = process.env.SCRAPE_CRON || '0 */6 * * *';

  if (!cron.validate(schedule)) {
    console.warn(`Invalid SCRAPE_CRON "${schedule}", using default 0 */6 * * *`);
  }

  const validSchedule = cron.validate(schedule) ? schedule : '0 */6 * * *';

  cron.schedule(validSchedule, async () => {
    console.log(`[scheduler] Running scrape job at ${new Date().toISOString()}`);
    await runScrapeJob();
  });

  console.log(`[scheduler] Started with cron: ${validSchedule}`);
}

export async function runScrapeJob() {
  const products = await productModel.getAllProducts();
  const results = [];
  let scraped = 0;
  let failed = 0;

  for (const product of products) {
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
