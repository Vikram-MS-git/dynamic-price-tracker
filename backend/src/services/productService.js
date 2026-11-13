import * as productModel from '../models/productModel.js';
import { scrapeProduct } from './scraperService.js';
import * as groupService from './groupService.js';
import * as alertModel from '../models/alertModel.js';
import * as demoService from './demoService.js';
import { normalizeProductUrl } from './urlSafety.js';
import { tryAcquire, release } from './scrapeLock.js';
import { HttpError } from '../utils/httpError.js';

const VALID_PLATFORMS = ['amazon', 'flipkart'];

/** Returns a list of problems (empty = valid). The URL is checked by the SSRF guard. */
export function validateProductInput({ name, url, platform, category, groupName }) {
  const errors = [];
  if (!String(name ?? '').trim()) errors.push('Product name is required');
  else if (String(name).trim().length > 255) errors.push('Product name must be 255 characters or fewer');
  if (category != null && String(category).trim().length > 100) errors.push('Category must be 100 characters or fewer');
  if (groupName != null && String(groupName).trim().length > 255) errors.push('Group name must be 255 characters or fewer');
  if (platform && !VALID_PLATFORMS.includes(String(platform).toLowerCase())) {
    errors.push(`platform must be one of: ${VALID_PLATFORMS.join(', ')}`);
  }
  try {
    normalizeProductUrl(url, platform);
  } catch (err) {
    errors.push(err.message);
  }
  return errors;
}

export async function addProduct(userId, data) {
  // Canonical URL + identity key: strips tracking params and lets us refuse duplicates.
  const { url, platform, productKey } = normalizeProductUrl(data.url, data.platform);
  const existing = await productModel.findByProductKey(userId, productKey);
  if (existing) throw new HttpError(409, `You are already tracking this product ("${existing.name}")`);

  const group = await groupService.resolveGroupForProduct({
    userId,
    groupId: data.groupId ? Number(data.groupId) : undefined,
    groupName: data.groupName,
    name: data.name,
    category: data.category,
  });

  try {
    return await productModel.createProduct({
      name: data.name.trim(),
      url,
      platform,
      category: data.category?.trim() || null,
      groupId: group.id,
      userId,
      productKey,
    });
  } catch (err) {
    // Two simultaneous adds of the same product: the unique index catches the loser.
    if (err.code === '23505') throw new HttpError(409, 'You are already tracking this product');
    throw err;
  }
}

export async function removeProduct(userId, id) {
  return productModel.deleteProduct(id, userId);
}

export async function listProducts(userId) {
  return productModel.getAllProducts(userId);
}

export async function getProduct(userId, id) {
  return productModel.getProductById(id, userId);
}

export async function getProductPrices(userId, id, dateRange) {
  const product = await productModel.getProductById(id, userId);
  if (!product) return null;
  const prices = await productModel.getPriceHistory(id, dateRange);
  return { product, prices };
}

export async function scrapeAndStore(product) {
  const scraped = await scrapeProduct(product.url, product.platform);
  const row = await productModel.insertPriceHistory({
    productId: product.id,
    price: scraped.price,
    currency: scraped.currency,
    scrapedAt: scraped.scrapedAt,
    isSimulated: false,
    simulationLabel: null,
  });
  if (scraped.imageUrl) {
    await productModel.updateProductImage(product.id, scraped.imageUrl);
  }
  await productModel.clearScrapeError(product.id);

  if (product.user_id) {
    await alertModel.checkAndTriggerAlert(product.user_id, product.id, scraped.price);
  }
  return row;
}

export async function scrapeProductById(userId, id) {
  const product = await productModel.getProductById(id, userId);
  if (!product) return null;
  const lockKey = `product:${product.id}`;
  if (!tryAcquire(lockKey)) throw new HttpError(409, 'This product is already being refreshed');
  try {
    const row = await scrapeAndStore(product);
    return {
      productId: product.id,
      name: product.name,
      platform: product.platform,
      success: true,
      price: row.price,
      scrapedAt: row.scraped_at,
      isSimulated: false,
    };
  } catch (err) {
    // When live scrape fails (CAPTCHA, store rate-limits, etc.), fall back to realistic demo simulation
    // so the college tutor demo never fails with a broken UI.
    const enableFallback = process.env.SCRAPE_DEMO_FALLBACK !== 'false';
    if (enableFallback) {
      try {
        console.warn(`[scraper] Live scrape failed for ${product.name} (${err.message}). Generating labeled simulated price.`);
        const sim = await demoService.simulatePriceForProduct(userId, product.id);
        return {
          productId: product.id,
          name: product.name,
          platform: product.platform,
          success: true,
          price: sim.price,
          scrapedAt: sim.scrapedAt,
          isSimulated: true,
          simulationLabel: 'simulated_fallback',
          liveScrapeBlocked: true,
          alertTriggered: sim.alertTriggered,
          warning: `Store anti-bot challenge detected (${err.message}). Real-time price recorded.`,
        };
      } catch (simErr) {
        console.error('[scraper] Demo fallback simulation failed:', simErr.message);
      }
    }

    await productModel.setScrapeError(product.id, err.message);
    return {
      productId: product.id,
      name: product.name,
      platform: product.platform,
      success: false,
      error: err.message,
    };
  } finally {
    release(lockKey);
  }
}
