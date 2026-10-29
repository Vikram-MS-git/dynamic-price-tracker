import { parseProductPage } from './pageParser.js';

let browserPromise = null;

const FLIPKART_SELECTORS = [
  'div[class*="Nx9bqj"]',
  'div[class*="Cxh3nd"]',
  'div[class*="hye64"]',
  '[class*="yRaY8j"]',
  '._30jeq3',
];

const AMAZON_PAY_SELECTORS = [
  '.priceToPay',
  '.apexPriceToPay',
  '#corePriceDisplay_desktop_feature_div .priceToPay',
  '#corePrice_feature_div .priceToPay',
];

const AMAZON_CORE_CONTAINERS = [
  '#corePriceDisplay_desktop_feature_div',
  '#corePrice_feature_div',
  '#apex_desktop',
];

const IMAGE_SELECTORS = {
  amazon: ['#landingImage', '#imgBlkFront', '#main-image', '.imgTagWrapper img'],
  flipkart: ['img[src*="rukminim"]', 'img[src*="flixcart"]', '._396cs4'],
};

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

async function extractPriceInPage(page, platform) {
  if (platform === 'amazon') {
    return page.evaluate(
      ({ paySelectors, coreContainers }) => {
        const parse = (raw) => {
          if (!raw) return null;
          const cleaned = String(raw).replace(/[^\d.]/g, '');
          const v = parseFloat(cleaned);
          return Number.isFinite(v) && v >= 1 ? v : null;
        };

        const isListPrice = (el) => {
          if (!el) return true;
          if (el.getAttribute('data-a-strike') === 'true') return true;
          return (
            el.getAttribute('data-a-color') === 'secondary' &&
            el.classList.contains('a-text-price')
          );
        };

        const readPrice = (el) => {
          if (!el || isListPrice(el)) return null;

          const off = el.querySelector('.a-offscreen');
          const fromOff = parse(off?.textContent);
          if (fromOff && fromOff >= 99) return fromOff;

          const whole = el.querySelector('.a-price-whole');
          if (whole) {
            const fraction = el.querySelector('.a-price-fraction');
            const combined = fraction
              ? `${whole.textContent}.${fraction.textContent}`
              : whole.textContent;
            const p = parse(combined);
            if (p && p >= 99) return p;
          }

          const p = parse(el.textContent);
          return p && p >= 99 ? p : null;
        };

        for (const sel of paySelectors) {
          for (const node of document.querySelectorAll(sel)) {
            const priceEl = node.classList?.contains('a-price') ? node : node.closest('.a-price') ?? node;
            const p = readPrice(priceEl);
            if (p && p < 50_000_000) return p;
          }
        }

        for (const container of coreContainers) {
          const root = document.querySelector(container);
          if (!root) continue;
          for (const el of root.querySelectorAll('.a-price')) {
            const p = readPrice(el);
            if (p && p < 50_000_000) return p;
          }
        }

        return null;
      },
      { paySelectors: AMAZON_PAY_SELECTORS, coreContainers: AMAZON_CORE_CONTAINERS }
    );
  }

  return page.evaluate((sels) => {
    const parse = (raw) => {
      if (!raw) return null;
      const cleaned = String(raw).replace(/[^\d.]/g, '');
      const v = parseFloat(cleaned);
      return Number.isFinite(v) && v >= 1 ? v : null;
    };

    for (const sel of sels) {
      const nodes = document.querySelectorAll(sel);
      for (const node of nodes) {
        const p = parse(node.textContent);
        if (p && p < 50_000_000) return p;
      }
    }

    const body = document.body?.innerText || '';
    const matches = body.match(/₹\s*([\d,]+(?:\.\d+)?)/g);
    if (matches) {
      const prices = matches
        .map((m) => parse(m.replace(/₹\s*/, '')))
        .filter((p) => p && p >= 99 && p < 50_000_000);
      if (prices.length) return Math.min(...prices);
    }
    return null;
  }, FLIPKART_SELECTORS);
}

async function extractImageInPage(page, platform) {
  const sels = IMAGE_SELECTORS[platform] ?? [];
  return page.evaluate((selectors) => {
    const pick = (url) => {
      if (!url || url.startsWith('data:')) return null;
      if (url.startsWith('//')) return `https:${url}`;
      if (/^https?:\/\//i.test(url)) return url;
      return null;
    };

    const og = document.querySelector('meta[property="og:image"]');
    const ogUrl = pick(og?.getAttribute('content'));
    if (ogUrl) return ogUrl;

    for (const sel of selectors) {
      const img = document.querySelector(sel);
      const src = img?.src || img?.getAttribute('data-src');
      const u = pick(src);
      if (u) return u;
    }
    return null;
  }, sels);
}

export async function scrapeWithPuppeteer(url, platform) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(getUserAgent());
    await page.setViewport({ width: 1366, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await new Promise((r) => setTimeout(r, 3000));

    let price = await extractPriceInPage(page, platform);
    let imageUrl = await extractImageInPage(page, platform);

    if (price === null || !imageUrl) {
      const html = await page.content();
      const parsed = parseProductPage(html, platform, url);
      if (price === null) price = parsed.price;
      if (!imageUrl) imageUrl = parsed.imageUrl;
    }

    if (price === null) {
      throw new Error(`Puppeteer loaded page but could not find price for ${platform}`);
    }

    return {
      price,
      imageUrl: imageUrl ?? null,
      currency: 'INR',
      scrapedAt: new Date().toISOString(),
      method: 'puppeteer',
    };
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
