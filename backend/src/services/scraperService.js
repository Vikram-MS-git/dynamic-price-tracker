import axios from 'axios';
import https from 'https';
import { parseProductPage } from './pageParser.js';
import { detectBotBlock } from './priceExtractor.js';
import { scrapeWithPuppeteer } from './puppeteerScraper.js';
import { assertAllowedUrl, safeLookup } from './urlSafety.js';

const DEFAULT_HEADERS = {
  'User-Agent':
    process.env.SCRAPE_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
  'Cache-Control': 'no-cache',
};

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const OVERALL_TIMEOUT_MS = Number(process.env.SCRAPE_TIMEOUT_MS) || 90_000;

// Every connection re-checks the resolved IPs (defends against DNS rebinding).
const httpsAgent = new https.Agent({ lookup: safeLookup, keepAlive: false });

function usePuppeteerAlways() {
  return process.env.SCRAPE_USE_PUPPETEER === 'true';
}

function usePuppeteerFallback() {
  if (process.env.SCRAPE_PUPPETEER_FALLBACK === 'false') return false;
  return process.env.SCRAPE_PUPPETEER_FALLBACK === 'true' || usePuppeteerAlways();
}

const NETWORK_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EHOSTUNREACH', 'ENETUNREACH']);

/** Turns low-level network errors into a message the user can act on; null if not a network error. */
export function describeNetworkError(err) {
  const code = err?.code || err?.cause?.code;
  if (!NETWORK_CODES.has(code)) return null;
  return `Could not reach the store (${code}). Check the server's internet connection and try again.`;
}

function buildResult({ price, imageUrl, method }) {
  if (price === null || price === undefined) throw new Error('Could not extract price from page');
  return { price, imageUrl: imageUrl ?? null, currency: 'INR', scrapedAt: new Date().toISOString(), method };
}

/**
 * GET a store page, following redirects manually so that EVERY hop is re-validated
 * (https, allowed store host, public IP). Throws UrlNotAllowedError for anything else.
 */
export async function safeGet(startUrl, { timeout = 20_000 } = {}) {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    assertAllowedUrl(current);
    const res = await axios.get(current, {
      headers: DEFAULT_HEADERS,
      timeout,
      maxRedirects: 0,
      validateStatus: () => true,
      httpsAgent,
      responseType: 'text',
      transformResponse: (x) => x,
      maxContentLength: MAX_BYTES,
      maxBodyLength: MAX_BYTES,
    });
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      current = new URL(res.headers.location, current).toString();
      continue;
    }
    return { response: res, finalUrl: current };
  }
  throw new Error('Too many redirects');
}

async function scrapeWithCheerio(url) {
  const { response, finalUrl } = await safeGet(url);
  const html = typeof response.data === 'string' ? response.data : '';
  const blocked = detectBotBlock(html);

  if (response.status >= 400) {
    throw new Error(blocked ? `${blocked} (HTTP ${response.status})` : `HTTP ${response.status} fetching product page`);
  }
  const { price, imageUrl } = parseProductPage(html, assertAllowedUrl(finalUrl).platform, finalUrl);
  if (price === null && blocked) throw new Error(blocked);
  return buildResult({ price, imageUrl, method: 'cheerio' });
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function run(url, platform) {
  if (usePuppeteerAlways()) return scrapeWithPuppeteer(url, platform);

  try {
    return await scrapeWithCheerio(url);
  } catch (cheerioErr) {
    if (cheerioErr.name === 'UrlNotAllowedError') throw cheerioErr; // never retry a blocked URL
    const network = describeNetworkError(cheerioErr);
    if (network) throw new Error(network); // a browser would fail the same way; no point falling back
    if (!usePuppeteerFallback()) {
      throw new Error(`${cheerioErr.message}. Set SCRAPE_PUPPETEER_FALLBACK=true in backend/.env`);
    }
    console.warn(`[scraper] Cheerio failed (${platform}): ${cheerioErr.message}. Trying Puppeteer`);
    try {
      return await scrapeWithPuppeteer(url, platform);
    } catch (puppeteerErr) {
      throw new Error(`Cheerio: ${cheerioErr.message}. Puppeteer: ${puppeteerErr.message}`);
    }
  }
}

export async function scrapeProduct(url, platform) {
  // Re-validate on every scrape: rows saved before validation existed must not bypass it.
  const { platform: hostPlatform } = assertAllowedUrl(url);
  const wanted = platform?.toLowerCase();
  if (wanted && wanted !== hostPlatform) throw new Error(`URL host is ${hostPlatform}, but product platform is ${wanted}`);
  return withTimeout(run(url, hostPlatform), OVERALL_TIMEOUT_MS, 'Scrape');
}
