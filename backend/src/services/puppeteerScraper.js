import { parseProductPage } from './pageParser.js';
import { detectBotBlock } from './priceExtractor.js';
import { assertAllowedUrl, assertPublicHost } from './urlSafety.js';

let browserPromise = null;

function getUserAgent() {
  return (
    process.env.SCRAPE_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
}

async function getBrowser() {
  if (!browserPromise) {
    const puppeteer = await import('puppeteer');
    browserPromise = puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return browserPromise;
}

/**
 * Block anything that is not plain web traffic to a public host. Main-frame navigations
 * (including each redirect hop) must additionally be an allowed store URL.
 */
async function guardRequests(page) {
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    try {
      const raw = req.url();
      if (raw.startsWith('data:') || raw.startsWith('blob:') || raw === 'about:blank') return req.continue();
      const u = new URL(raw);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return req.abort('blockedbyclient');
      if (req.isNavigationRequest() && req.frame() === page.mainFrame()) assertAllowedUrl(raw);
      await assertPublicHost(u.hostname);
      if (['media', 'font'].includes(req.resourceType())) return req.abort('blockedbyclient');
      return req.continue();
    } catch {
      return req.abort('blockedbyclient');
    }
  });
}

export async function scrapeWithPuppeteer(url, platform) {
  assertAllowedUrl(url); // never open a URL that has not passed validation
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(getUserAgent());
    await page.setViewport({ width: 1366, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });
    await guardRequests(page);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    } catch (err) {
      // Stores keep connections open; if the page loaded enough to read, carry on.
      if (!/timeout/i.test(err.message)) throw err;
    }
    await new Promise((r) => setTimeout(r, 3000));

    // One extraction code path (shared with the plain-HTTP scraper): parse the rendered HTML.
    const html = await page.content();
    const { price, imageUrl } = parseProductPage(html, platform, page.url());
    if (price === null) {
      const blocked = detectBotBlock(html);
      throw new Error(blocked || `Puppeteer loaded the page but could not find a price for ${platform}`);
    }
    return { price, imageUrl: imageUrl ?? null, currency: 'INR', scrapedAt: new Date().toISOString(), method: 'puppeteer' };
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    browserPromise = null;
    await browser.close();
  }
}
