// Fixtures here are SYNTHETIC: hand-written HTML that mimics each store's price markup.
// They prove the parsing logic, not that the live stores still use this markup.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePriceText, parseAmounts, extractPriceFromHtml, detectBotBlock } from '../src/services/priceExtractor.js';
import { scrapeProduct, describeNetworkError } from '../src/services/scraperService.js';

const amazonPage = (inner) => `<html><body>${inner}</body></html>`;
const amazonPrice = (v, whole, frac = '00') =>
  `<span class="a-price" data-a-color="price"><span class="a-offscreen">₹${v}</span><span aria-hidden="true"><span class="a-price-symbol">₹</span><span class="a-price-whole">${whole}<span class="a-price-decimal">.</span></span><span class="a-price-fraction">${frac}</span></span></span>`;
const amazonMrp = (v) => `<span class="a-price a-text-price" data-a-strike="true" data-a-color="secondary"><span class="a-offscreen">₹${v}</span></span>`;

// ---- parsePriceText / parseAmounts: regression tests for the digit-joining bug found in the audit
test('REGRESSION: "₹1,299 ₹1,999" yields the first amount, not 12991999', () => {
  assert.equal(parsePriceText('₹1,299 ₹1,999'), 1299);
  assert.equal(parsePriceText('₹1,299₹1,999 35% off'), 1299);
});

test('parsePriceText accepts plain numbers, Indian grouping, paise, and rejects non-prices', () => {
  assert.equal(parsePriceText('1299'), 1299);
  assert.equal(parsePriceText(1299.5), 1299.5);
  assert.equal(parsePriceText('₹1,29,999.00'), 129999);
  assert.equal(parsePriceText('Rs. 499'), 499);
  assert.equal(parsePriceText('35% off'), null);
  assert.equal(parsePriceText(''), null);
  assert.equal(parsePriceText(null), null);
  assert.equal(parsePriceText('free'), null);
  assert.equal(parsePriceText(0), null);
  assert.equal(parsePriceText('₹0'), null);
});

test('parseAmounts lists every currency amount in order', () => {
  assert.deepEqual(parseAmounts('₹1,299 ₹1,999 35% off'), [1299, 1999]);
});

// ---- Amazon
test('Amazon: returns the selling price, not the struck-through MRP', () => {
  const html = amazonPage(`<div id="corePriceDisplay_desktop_feature_div"><span class="priceToPay">${amazonPrice('1,299.00', '1,299')}</span>${amazonMrp('1,999.00')}</div>`);
  assert.equal(extractPriceFromHtml(html, 'amazon'), 1299);
});

test('Amazon: prices below ₹99 are accepted (old code rejected them)', () => {
  const html = amazonPage(`<div id="corePriceDisplay_desktop_feature_div"><span class="priceToPay">${amazonPrice('49.00', '49')}</span></div>`);
  assert.equal(extractPriceFromHtml(html, 'amazon'), 49);
});

test('Amazon: reads whole+fraction when .a-offscreen is missing', () => {
  const html = amazonPage('<div id="corePrice_feature_div"><span class="a-price"><span class="a-price-whole">2,499<span class="a-price-decimal">.</span></span><span class="a-price-fraction">50</span></span></div>');
  assert.equal(extractPriceFromHtml(html, 'amazon'), 2499.5);
});

test('Amazon: only an MRP on the page returns null (never the MRP)', () => {
  const html = amazonPage(`<div id="corePriceDisplay_desktop_feature_div">${amazonMrp('1,999.00')}</div>`);
  assert.equal(extractPriceFromHtml(html, 'amazon'), null);
});

test('Amazon: a price from a carousel outside the main price block is not used', () => {
  const html = amazonPage(`<div class="carousel">${amazonPrice('499.00', '499')}</div>`);
  assert.equal(extractPriceFromHtml(html, 'amazon'), null);
});

test('Amazon: <del>-wrapped price is treated as MRP', () => {
  const html = amazonPage(`<div id="corePrice_feature_div"><del>${amazonPrice('1,999.00', '1,999')}</del><span class="priceToPay">${amazonPrice('1,299.00', '1,299')}</span></div>`);
  assert.equal(extractPriceFromHtml(html, 'amazon'), 1299);
});

// ---- Flipkart
test('Flipkart: selling price element wins over MRP element', () => {
  const html = '<html><body><div class="Nx9bqj CxhGGd">₹1,299</div><div class="yRaY8j A6+E6v">₹1,999</div></body></html>';
  assert.equal(extractPriceFromHtml(html, 'flipkart'), 1299);
});

test('REGRESSION: Flipkart block containing price and MRP together reads 1299, not 12991999', () => {
  const html = '<html><body><div class="Nx9bqj CxhGGd">₹1,299<div class="yRaY8j">₹1,999</div></div></body></html>';
  assert.equal(extractPriceFromHtml(html, 'flipkart'), 1299);
});

test('REGRESSION: Flipkart page with unknown markup no longer returns the first ₹ on the page (MRP)', () => {
  const html = '<html><body><span>M.R.P ₹1,999</span><span>Special price ₹1,299</span></body></html>';
  assert.equal(extractPriceFromHtml(html, 'flipkart'), null);
});

test('REGRESSION: embedded JSON with only strikeOffPrice (MRP) returns null', () => {
  assert.equal(extractPriceFromHtml('<script>{"strikeOffPrice":1999}</script>', 'flipkart'), null);
});

test('Flipkart: embedded finalPrice wins over strikeOffPrice', () => {
  assert.equal(extractPriceFromHtml('<script>{"strikeOffPrice":1999,"finalPrice":1299}</script>', 'flipkart'), 1299);
});

test('Flipkart: JSON-LD offer price is used when selectors miss', () => {
  const html = '<script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","price":"1299","priceCurrency":"INR"}}</script>';
  assert.equal(extractPriceFromHtml(html, 'flipkart'), 1299);
});

test('JSON-LD @graph and offer arrays are understood; malformed JSON-LD is ignored', () => {
  const graph = '<script type="application/ld+json">{"@graph":[{"@type":"Product","offers":[{"price":2599}]}]}</script>';
  assert.equal(extractPriceFromHtml(graph, 'flipkart'), 2599);
  assert.equal(extractPriceFromHtml('<script type="application/ld+json">{oops</script>', 'flipkart'), null);
});

test('meta price tag is used as a fallback', () => {
  assert.equal(extractPriceFromHtml('<meta property="product:price:amount" content="749.00">', 'amazon'), 749);
});

test('empty and garbage HTML return null without throwing', () => {
  for (const html of ['', '<html></html>', 'plain text ₹ nothing']) {
    assert.equal(extractPriceFromHtml(html, 'amazon'), null);
    assert.equal(extractPriceFromHtml(html, 'flipkart'), null);
  }
});

// ---- bot block detection
test('detectBotBlock recognises Amazon CAPTCHA pages and ignores normal pages', () => {
  assert.match(detectBotBlock('<form action="/errors/validateCaptcha">Enter the characters you see below</form>'), /CAPTCHA/);
  assert.equal(detectBotBlock('<html><body>Normal product page</body></html>'), null);
});

// ---- scrapeProduct refuses unsafe URLs before any network access
test('scrapeProduct refuses internal, non-https and foreign URLs (SSRF regression)', async () => {
  for (const url of ['http://127.0.0.1:8099/secret', 'https://127.0.0.1/x', 'https://169.254.169.254/latest/meta-data/',
    'file:///etc/passwd', 'https://evil.example.com/dp/B0CAROL001']) {
    await assert.rejects(() => scrapeProduct(url, 'amazon'), (e) => e.name === 'UrlNotAllowedError', url);
  }
});

test('scrapeProduct refuses a platform that does not match the host', async () => {
  await assert.rejects(() => scrapeProduct('https://www.amazon.in/dp/B0CAROL001', 'flipkart'), /platform/);
});

test('network failures get an actionable message; other errors are left alone', () => {
  assert.match(describeNetworkError({ code: 'ENOTFOUND' }), /Could not reach the store \(ENOTFOUND\)/);
  assert.match(describeNetworkError({ cause: { code: 'ETIMEDOUT' } }), /ETIMEDOUT/);
  assert.equal(describeNetworkError(new Error('Could not extract price from page')), null);
  assert.equal(describeNetworkError(null), null);
});
