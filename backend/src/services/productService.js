import * as productModel from '../models/productModel.js';
import { scrapeProduct } from './scraperService.js';
import * as groupService from './groupService.js';

const VALID_PLATFORMS = ['amazon', 'flipkart'];

export function validateProductInput({ name, url, platform, category }) {
  const errors = [];
  if (!name?.trim()) errors.push('name is required');
  if (!url?.trim()) errors.push('url is required');
  if (!platform?.trim()) errors.push('platform is required');
  else if (!VALID_PLATFORMS.includes(platform.toLowerCase())) {
    errors.push(`platform must be one of: ${VALID_PLATFORMS.join(', ')}`);
  }
  try {
    new URL(url);
  } catch {
    errors.push('url must be a valid URL');
  }
  return errors;
}

export async function addProduct(data) {
  const group = await groupService.resolveGroupForProduct({
    groupId: data.groupId ? Number(data.groupId) : undefined,
    groupName: data.groupName,
    name: data.name,
    category: data.category,
  });

  return productModel.createProduct({
    name: data.name.trim(),
    url: data.url.trim(),
    platform: data.platform.toLowerCase(),
    category: data.category?.trim() || null,
    groupId: group.id,
  });
}

export async function removeProduct(id) {
  return productModel.deleteProduct(id);
}

export async function listProducts() {
  return productModel.getAllProducts();
}

export async function getProduct(id) {
  return productModel.getProductById(id);
}

export async function getProductPrices(id, dateRange) {
  const product = await productModel.getProductById(id);
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
  });
  if (scraped.imageUrl) {
    await productModel.updateProductImage(product.id, scraped.imageUrl);
  }
  await productModel.clearScrapeError(product.id);
  return row;
}

export async function scrapeProductById(id) {
  const product = await productModel.getProductById(id);
  if (!product) return null;
  try {
    const row = await scrapeAndStore(product);
    return {
      productId: product.id,
      name: product.name,
      platform: product.platform,
      success: true,
      price: row.price,
      scrapedAt: row.scraped_at,
    };
  } catch (err) {
    await productModel.setScrapeError(product.id, err.message);
    return {
      productId: product.id,
      name: product.name,
      platform: product.platform,
      success: false,
      error: err.message,
    };
  }
}
