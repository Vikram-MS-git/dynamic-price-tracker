/**
 * Live scraping check. Run on YOUR machine (needs internet):
 *     npm run scrape:check -- "https://www.amazon.in/dp/XXXXXXXXXX"
 * Prints what the scraper actually reads from the page. No database needed.
 * Compare the printed price with the price you see in your browser.
 */
import 'dotenv/config';
import { normalizeProductUrl } from '../services/urlSafety.js';
import { scrapeProduct } from '../services/scraperService.js';
import { closeBrowser } from '../services/puppeteerScraper.js';

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run scrape:check -- "<amazon-or-flipkart-product-url>"');
  process.exit(2);
}

let exitCode = 0;
try {
  const { url, platform, productKey } = normalizeProductUrl(input);
  console.log(`Platform    : ${platform}`);
  console.log(`Clean URL   : ${url}`);
  console.log(`Product key : ${productKey}`);
  console.log('Fetching…');
  const started = Date.now();
  const r = await scrapeProduct(url, platform);
  console.log(`\nOK in ${((Date.now() - started) / 1000).toFixed(1)}s via ${r.method}`);
  console.log(`Price       : ₹${r.price.toLocaleString('en-IN')}   <- must match the price shown in your browser`);
  console.log(`Image       : ${r.imageUrl ?? '(none found)'}`);
} catch (err) {
  console.error(`\nFAILED: ${err.message}`);
  exitCode = 1;
} finally {
  await closeBrowser().catch(() => {});
}
process.exit(exitCode);
