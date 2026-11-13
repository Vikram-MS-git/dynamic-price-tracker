import * as cheerio from 'cheerio';

/**
 * Selling-price extraction from product-page HTML.
 *
 * Design rules:
 *  - Read exactly ONE amount from a text node (never join digits from several numbers).
 *  - Never return a struck-through list price (MRP).
 *  - Prefer returning null (a clear "could not read price" error) over guessing.
 *
 * NOTE: store class names change often. The selectors below are best-effort and must be
 * re-verified against live pages (see `npm run scrape:check`).
 */
const MAX_PRICE = 50_000_000;

// Scoped selectors first, broad ones last, so another product's price is never picked up
// when the main price block exists.
const AMAZON_PAY_SELECTORS = [
  '#corePriceDisplay_desktop_feature_div .priceToPay',
  '#corePrice_feature_div .priceToPay',
  '#apex_desktop .priceToPay',
  '#corePriceDisplay_desktop_feature_div .apexPriceToPay',
  '.priceToPay',
  '.apexPriceToPay',
  '#price_inside_buybox',
  '#priceblock_ourprice',
  '#priceblock_dealprice',
];

const AMAZON_CORE_CONTAINERS = [
  '#corePriceDisplay_desktop_feature_div',
  '#corePrice_feature_div',
  '#apex_desktop',
  '#tp_price_block_total_price_ww',
];

// Selling-price elements. (Flipkart's struck-through MRP element is deliberately NOT listed.)
const FLIPKART_PRICE_SELECTORS = [
  'div[class*="Nx9bqj"]',
  'div[class*="Cxh3nd"]',
  '._30jeq3._16Jk6d',
  '._30jeq3',
];

const AMOUNT_RE = /(?:₹|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
const PLAIN_NUMBER_RE = /^[0-9][0-9,]*(?:\.[0-9]{1,2})?$/;

const inRange = (n) => Number.isFinite(n) && n >= 1 && n < MAX_PRICE;

/** All currency-prefixed amounts in a string, in order of appearance. */
export function parseAmounts(text) {
  const out = [];
  if (text == null) return out;
  for (const m of String(text).matchAll(AMOUNT_RE)) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (inRange(n)) out.push(n);
  }
  return out;
}

/**
 * One price from a value or text.
 *   "₹1,299.00"        -> 1299
 *   "₹1,299 ₹1,999"    -> 1299   (first amount only)
 *   "1299"/1299        -> 1299
 *   "35% off"          -> null   (no currency, not a plain number)
 */
export function parsePriceText(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return inRange(raw) ? raw : null;
  const text = String(raw).trim();
  if (PLAIN_NUMBER_RE.test(text)) {
    const n = parseFloat(text.replace(/,/g, ''));
    return inRange(n) ? n : null;
  }
  return parseAmounts(text)[0] ?? null;
}

/** True for elements that display a crossed-out (list/MRP) price. */
function isStruck($, el) {
  let node = $(el);
  for (let depth = 0; node.length && depth < 8; depth += 1) {
    const tag = (node.prop('tagName') || '').toLowerCase();
    if (tag === 'del' || tag === 's' || tag === 'strike') return true;
    if (/line-through/i.test(node.attr('style') || '')) return true;
    if (node.attr('data-a-strike') === 'true') return true;
    if (node.attr('data-a-color') === 'secondary' && node.hasClass('a-text-price')) return true;
    if (node.hasClass('a-text-strike')) return true;
    node = node.parent();
  }
  return false;
}

function extractFromJsonLd($) {
  let found = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const raw = $(el).html();
      if (!raw) return;
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
      for (const item of items) {
        const offers = Array.isArray(item?.offers) ? item.offers : item?.offers ? [item.offers] : [];
        for (const o of offers) {
          const p = parsePriceText(o?.price ?? o?.lowPrice ?? o?.priceSpecification?.price);
          if (p) {
            found = p;
            return;
          }
        }
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  });
  return found;
}

function extractFromEmbeddedJson(html, platform) {
  // Last resort. Only keys that mean "price the customer pays" (never strike-off / MRP).
  const patterns =
    platform === 'flipkart'
      ? [/"finalPrice"\s*:\s*(\d+(?:\.\d+)?)/i, /"sellingPrice"\s*:\s*(\d+(?:\.\d+)?)/i, /"fsp"\s*:\s*(\d+(?:\.\d+)?)/i,
         /\\"finalPrice\\":\s*(\d+(?:\.\d+)?)/i]
      : [/"priceAmount"\s*:\s*(\d+(?:\.\d+)?)/i, /"buyingPrice"\s*:\s*(\d+(?:\.\d+)?)/i];
  for (const re of patterns) {
    const m = html.match(re);
    const p = m ? parsePriceText(m[1]) : null;
    if (p) return p;
  }
  return null;
}

function readAmazonPriceFromElement($, el) {
  const node = $(el);
  if (isStruck($, node)) return null;

  const offscreen = node.find('.a-offscreen').first().text().trim() || (node.hasClass('a-offscreen') ? node.text().trim() : '');
  if (offscreen) {
    const p = parsePriceText(offscreen);
    if (p) return p;
  }

  const whole = node.find('.a-price-whole').first().text().replace(/[^\d,]/g, '');
  if (whole) {
    const fraction = node.find('.a-price-fraction').first().text().replace(/\D/g, '');
    const p = parsePriceText(fraction ? `${whole}.${fraction}` : whole);
    if (p) return p;
  }
  return parsePriceText(node.text());
}

function extractAmazonPrice($) {
  for (const selector of AMAZON_PAY_SELECTORS) {
    const nodes = $(selector);
    for (let i = 0; i < nodes.length; i += 1) {
      const p = readAmazonPriceFromElement($, nodes[i]);
      if (p) return p;
    }
  }
  for (const container of AMAZON_CORE_CONTAINERS) {
    let found = null;
    $(container).find('.a-price').each((_, el) => {
      if (found) return;
      const p = readAmazonPriceFromElement($, el);
      if (p) found = p;
    });
    if (found) return found;
  }
  return null;
}

function extractFlipkartPrice($) {
  for (const selector of FLIPKART_PRICE_SELECTORS) {
    const nodes = $(selector);
    for (let i = 0; i < nodes.length && i < 5; i += 1) {
      if (isStruck($, nodes[i])) continue;
      // The first amount is the selling price; a following one (if any) is the MRP.
      const p = parseAmounts($(nodes[i]).text())[0];
      if (p) return p;
    }
  }
  return null;
}

function extractFromMeta($) {
  for (const sel of ['meta[property="product:price:amount"]', 'meta[property="og:price:amount"]']) {
    const p = parsePriceText($(sel).attr('content'));
    if (p) return p;
  }
  return null;
}

export function extractPriceFromHtml(html, platform) {
  const $ = cheerio.load(html);
  const bySelector = platform === 'amazon' ? extractAmazonPrice($) : extractFlipkartPrice($);
  return bySelector || extractFromMeta($) || extractFromJsonLd($) || extractFromEmbeddedJson(html, platform) || null;
}

/** Recognise store "are you a robot?" pages so the error message is honest. */
export function detectBotBlock(html) {
  const t = String(html || '').slice(0, 200_000).toLowerCase();
  if (t.includes('validatecaptcha') || t.includes('enter the characters you see below') || t.includes('api-services-support@amazon.com')) {
    return 'Amazon showed a CAPTCHA (bot check)';
  }
  if (t.includes('are you a human') || t.includes('recaptcha') || t.includes('access denied') && t.includes('flipkart')) {
    return 'The store showed a bot check';
  }
  return null;
}
