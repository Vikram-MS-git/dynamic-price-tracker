import axios from 'axios';
import { parseProductPage } from './pageParser.js';
import { scrapeWithPuppeteer } from './puppeteerScraper.js';

const DEFAULT_HEADERS = {
  'User-Agent':
    process.env.SCRAPE_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
  'Cache-Control': 'no-cache',
};

const SUPPORTED = ['amazon', 'flipkart'];

function usePuppeteerAlways() {
  return process.env.SCRAPE_USE_PUPPETEER === 'true';
}

function usePuppeteerFallback() {
  if (process.env.SCRAPE_PUPPETEER_FALLBACK === 'false') return false;
  return process.env.SCRAPE_PUPPETEER_FALLBACK === 'true' || usePuppeteerAlways();
}

function buildResult({ price, imageUrl, method }) {
  if (price === null) {
    throw new Error('Could not extract price from page');
  }
  return {
    price,
    imageUrl: imageUrl ?? null,
    currency: 'INR',
    scrapedAt: new Date().toISOString(),
    method,
  };
}

async function scrapeWithCheerio(url, platform) {
  const response = await axios.get(url, {
    headers: DEFAULT_HEADERS,
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: (s) => s < 500,
  });

  if (response.status >= 400) {
    throw new Error(`HTTP ${response.status} fetching product page`);
  }

  const { price, imageUrl } = parseProductPage(response.data, platform, url);
  return buildResult({ price, imageUrl, method: 'cheerio' });
}

export async function scrapeProduct(url, platform) {
  const normalizedPlatform = platform?.toLowerCase();
  if (!SUPPORTED.includes(normalizedPlatform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  if (usePuppeteerAlways()) {
    return scrapeWithPuppeteer(url, normalizedPlatform);
  }

  try {
    return await scrapeWithCheerio(url, normalizedPlatform);
  } catch (cheerioErr) {
    if (!usePuppeteerFallback()) {
      throw new Error(
        `${cheerioErr.message}. Set SCRAPE_PUPPETEER_FALLBACK=true in backend/.env`
      );
    }
    console.warn(
      `[scraper] Cheerio failed (${normalizedPlatform}): ${cheerioErr.message} — trying Puppeteer`
    );
    try {
      return await scrapeWithPuppeteer(url, normalizedPlatform);
    } catch (puppeteerErr) {
      throw new Error(
        `Cheerio: ${cheerioErr.message}. Puppeteer: ${puppeteerErr.message}`
      );
    }
  }
}
