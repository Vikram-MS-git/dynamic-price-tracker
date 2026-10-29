import * as cheerio from 'cheerio';

const AMAZON_PAY_SELECTORS = [
  '.priceToPay',
  '.apexPriceToPay',
  '#corePriceDisplay_desktop_feature_div .priceToPay',
  '#corePrice_feature_div .priceToPay',
  '#apex_desktop .priceToPay',
  'span.a-price[data-a-color="price"]',
  '#price_inside_buybox .a-price',
  '#priceblock_ourprice',
  '#priceblock_dealprice',
];

const AMAZON_CORE_CONTAINERS = [
  '#corePriceDisplay_desktop_feature_div',
  '#corePrice_feature_div',
  '#apex_desktop',
  '#tp_price_block_total_price_ww',
];

const PLATFORM_SELECTORS = {
  amazon: [],
  flipkart: [
    'div[class*="Nx9bqj"]',
    'div[class*="Cxh3nd"]',
    'div[class*="hZ3ipK"]',
    'div[class*="hye64"]',
    'div[class*="yRaY8j"]',
    '._30jeq3._16Jk6d',
    '._30jeq3',
    '.Nx9bqj.Cxh3nd',
    '[class*="4l73"]',
    '#container div[class*="Nx9bqj"]',
  ],
};

export function parsePriceText(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^\d.]/g, '');
  const value = parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 1) return null;
  return value;
}

function extractFromJsonLd($) {
  let found = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const raw = $(el).html();
      if (!raw) return;
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const offers = item.offers;
        const candidates = [];
        if (offers?.price != null) candidates.push(offers.price);
        if (offers?.lowPrice != null) candidates.push(offers.lowPrice);
        if (Array.isArray(offers)) {
          for (const o of offers) {
            if (o?.price != null) candidates.push(o.price);
          }
        }
        for (const c of candidates) {
          const p = parsePriceText(c);
          if (p) found = p;
        }
      }
    } catch {
      /* ignore */
    }
  });
  return found;
}

function extractFromEmbeddedJson(html, platform) {
  const patterns =
    platform === 'flipkart'
      ? [
          /"finalPrice"\s*:\s*(\d+(?:\.\d+)?)/i,
          /"sellingPrice"\s*:\s*(\d+(?:\.\d+)?)/i,
          /"fsp"\s*:\s*(\d+(?:\.\d+)?)/i,
          /"strikeOffPrice"\s*:\s*(\d+(?:\.\d+)?)/i,
          /"value"\s*:\s*(\d{3,}(?:\.\d+)?)/i,
          /\\"finalPrice\\":\s*(\d+(?:\.\d+)?)/i,
          /"price"\s*:\s*(\d{3,}(?:\.\d+)?)/,
          /₹\s*([\d,]+)/,
        ]
      : [
          /"priceAmount"\s*:\s*(\d+(?:\.\d+)?)/i,
          /"buyingPrice"\s*:\s*(\d+(?:\.\d+)?)/i,
          /"price"\s*:\s*"([\d,]+\.?\d*)"/,
        ];

  for (const re of patterns) {
    const match = html.match(re);
    if (match) {
      const p = parsePriceText(match[1]);
      if (p && p >= 10 && p < 50_000_000) return p;
    }
  }
  return null;
}

function isAmazonListPrice($, el) {
  const node = $(el);
  if (node.attr('data-a-strike') === 'true') return true;
  if (node.attr('data-a-color') === 'secondary' && node.hasClass('a-text-price')) return true;
  return false;
}

function readAmazonPriceFromElement($, el) {
  const node = $(el);
  if (isAmazonListPrice($, node)) return null;

  const offscreen = node.find('.a-offscreen').first().text().trim();
  if (offscreen) {
    const price = parsePriceText(offscreen);
    if (price) return price;
  }

  const whole = node.find('.a-price-whole').first().text().trim();
  if (whole) {
    const fraction = node.find('.a-price-fraction').first().text().trim();
    const combined = fraction ? `${whole}.${fraction}` : whole;
    const price = parsePriceText(combined);
    if (price) return price;
  }

  return parsePriceText(node.text().trim());
}

function extractAmazonPrice($) {
  for (const selector of AMAZON_PAY_SELECTORS) {
    const nodes = $(selector);
    for (let i = 0; i < nodes.length; i += 1) {
      const price = readAmazonPriceFromElement($, nodes[i]);
      if (price && price >= 99 && price < 50_000_000) return price;
    }
  }

  for (const container of AMAZON_CORE_CONTAINERS) {
    let found = null;
    $(container)
      .find('.a-price')
      .each((_, el) => {
        if (found) return;
        const price = readAmazonPriceFromElement($, el);
        if (price && price >= 99 && price < 50_000_000) found = price;
      });
    if (found) return found;
  }

  return null;
}

function extractFromSelectors($, platform) {
  if (platform === 'amazon') {
    return extractAmazonPrice($);
  }

  const selectors = PLATFORM_SELECTORS[platform] ?? [];
  for (const selector of selectors) {
    const nodes = $(selector);
    for (let i = 0; i < nodes.length && i < 5; i += 1) {
      const text = $(nodes[i]).text().trim();
      const price = parsePriceText(text);
      if (price) return price;
    }
  }
  return null;
}

function extractFromMeta($) {
  const og = $('meta[property="product:price:amount"]').attr('content');
  if (og) {
    const p = parsePriceText(og);
    if (p) return p;
  }
  return null;
}

export function extractPriceFromHtml(html, platform) {
  const $ = cheerio.load(html);
  return (
    extractFromSelectors($, platform) ||
    extractFromMeta($) ||
    extractFromJsonLd($) ||
    extractFromEmbeddedJson(html, platform)
  );
}
