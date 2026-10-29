import * as cheerio from 'cheerio';
import { extractPriceFromHtml } from './priceExtractor.js';
import { extractImageFromHtml } from './imageExtractor.js';

export function parseProductPage(html, platform, pageUrl = '') {
  const price = extractPriceFromHtml(html, platform);
  const imageUrl = extractImageFromHtml(html, platform, pageUrl);
  return { price, imageUrl };
}

export { extractPriceFromHtml, extractImageFromHtml };
