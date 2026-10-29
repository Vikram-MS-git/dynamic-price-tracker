import * as cheerio from 'cheerio';

const IMAGE_SELECTORS = {
  amazon: [
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    '#imgTagWrapperId img',
    '.imgTagWrapper img',
    '#ebooksImgBlkFront',
  ],
  flipkart: [
    'img[src*="rukminim"]',
    'img[src*="flixcart"]',
    '._396cs4',
    'img[class*="DByuf"]',
    'img[class*="q6DCl"]',
  ],
};

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:')) return false;
  return /^https?:\/\//i.test(url) || url.startsWith('//');
}

function normalizeImageUrl(url, pageUrl) {
  if (!url) return null;
  let u = url.trim();
  if (u.startsWith('//')) u = `https:${u}`;
  if (u.startsWith('/') && pageUrl) {
    try {
      const base = new URL(pageUrl);
      u = `${base.origin}${u}`;
    } catch {
      return null;
    }
  }
  return isValidImageUrl(u) ? u : null;
}

function extractFromJsonLd($) {
  let found = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const data = JSON.parse($(el).html() || '{}');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const img = item.image;
        if (typeof img === 'string' && isValidImageUrl(img)) found = img;
        if (Array.isArray(img) && img[0]) found = img[0];
        if (img?.url) found = img.url;
      }
    } catch {
      /* ignore */
    }
  });
  return found;
}

export function extractImageFromHtml(html, platform, pageUrl = '') {
  const $ = cheerio.load(html);

  const og = $('meta[property="og:image"]').attr('content');
  const ogNorm = normalizeImageUrl(og, pageUrl);
  if (ogNorm) return ogNorm;

  const jsonLd = extractFromJsonLd($);
  const jsonNorm = normalizeImageUrl(jsonLd, pageUrl);
  if (jsonNorm) return jsonNorm;

  const selectors = IMAGE_SELECTORS[platform] ?? [];
  for (const selector of selectors) {
    const el = $(selector).first();
    const dynamic = el.attr('data-a-dynamic-image');
    if (dynamic) {
      try {
        const map = JSON.parse(dynamic);
        const urls = Object.keys(map);
        if (urls[0]) {
          const norm = normalizeImageUrl(urls[0], pageUrl);
          if (norm) return norm;
        }
      } catch {
        /* ignore */
      }
    }

    const src = el.attr('src') || el.attr('data-src') || el.attr('data-old-hires');
    const norm = normalizeImageUrl(src, pageUrl);
    if (norm) return norm;
  }

  return null;
}
