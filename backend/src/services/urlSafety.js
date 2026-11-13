/**
 * SSRF protection + product URL normalisation.
 *
 * Rules (applied when a product is added AND again at every scrape/redirect hop):
 *   - https only, no credentials in the URL, no custom port
 *   - hostname must belong to Amazon or Flipkart (allowlist below)
 *   - the hostname must resolve only to public IP addresses
 */
import dns from 'dns';
import net from 'net';

export class UrlNotAllowedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UrlNotAllowedError';
    this.status = 400;
  }
}

const AMAZON_DOMAINS = ['amazon.in', 'amazon.com'];
const AMAZON_SHORT_HOSTS = ['amzn.in', 'amzn.to', 'a.co'];
const FLIPKART_DOMAINS = ['flipkart.com'];
const FLIPKART_SHORT_HOSTS = ['fkrt.it'];

const isDomainOrSub = (host, domain) => host === domain || host.endsWith(`.${domain}`);

/** 'amazon' | 'flipkart' | null for a bare hostname. */
export function platformForHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (AMAZON_DOMAINS.some((d) => isDomainOrSub(host, d)) || AMAZON_SHORT_HOSTS.includes(host)) return 'amazon';
  if (FLIPKART_DOMAINS.some((d) => isDomainOrSub(host, d)) || FLIPKART_SHORT_HOSTS.includes(host)) return 'flipkart';
  return null;
}

// ---------------------------------------------------------------------------
// IP address classification
// ---------------------------------------------------------------------------
function ipv4ToInt(ip) {
  const p = ip.split('.').map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

const V4_BLOCKED = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([base, bits]) => ({ base: ipv4ToInt(base), mask: bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0 }));

function isPrivateV4(ip) {
  const n = ipv4ToInt(ip);
  return V4_BLOCKED.some(({ base, mask }) => ((n & mask) >>> 0) === ((base & mask) >>> 0));
}

/** Expand any IPv6 text form to 8 numeric hextets. */
function expandV6(ip) {
  let addr = ip.split('%')[0].toLowerCase();
  // Embedded IPv4 tail, e.g. ::ffff:127.0.0.1
  const v4tail = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4tail) {
    const n = ipv4ToInt(v4tail[1]);
    addr = addr.replace(v4tail[1], `${((n >>> 16) & 0xffff).toString(16)}:${(n & 0xffff).toString(16)}`);
  }
  const [head, tail] = addr.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const fill = tail === undefined ? 0 : 8 - h.length - t.length;
  return [...h, ...Array(Math.max(fill, 0)).fill('0'), ...t].map((x) => parseInt(x || '0', 16));
}

function isPrivateV6(ip) {
  const g = expandV6(ip);
  if (g.length !== 8 || g.some((x) => Number.isNaN(x))) return true; // unparseable: refuse
  const allZeroUntil = (n) => g.slice(0, n).every((x) => x === 0);
  if (g.every((x) => x === 0)) return true; // ::
  if (allZeroUntil(7) && g[7] === 1) return true; // ::1
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d)
  if (allZeroUntil(5) && (g[5] === 0xffff || g[5] === 0)) {
    return isPrivateV4(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`);
  }
  // NAT64 64:ff9b::/96 embeds an IPv4 address
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return isPrivateV4(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`);
  }
  return false;
}

/** True if the address is loopback / private / link-local / reserved (or not a valid IP). */
export function isPrivateAddress(ip) {
  const v = net.isIP(String(ip));
  if (v === 4) return isPrivateV4(ip);
  if (v === 6) return isPrivateV6(ip);
  return true;
}

/** dns.lookup wrapper for http(s).Agent: refuses to connect to non-public addresses. */
export function safeLookup(hostname, options, callback) {
  const opts = typeof options === 'function' ? {} : options || {};
  const cb = typeof options === 'function' ? options : callback;
  dns.lookup(hostname, { ...opts, all: true }, (err, addresses) => {
    if (err) return cb(err);
    const blocked = addresses.find((a) => isPrivateAddress(a.address));
    if (blocked) {
      return cb(new UrlNotAllowedError(`Blocked: ${hostname} resolves to a non-public address`));
    }
    if (opts.all) return cb(null, addresses);
    return cb(null, addresses[0].address, addresses[0].family);
  });
}

/** Resolve a hostname and make sure every address is public. */
export async function assertPublicHost(hostname) {
  const host = String(hostname).replace(/^\[|\]$/g, '');
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new UrlNotAllowedError('Blocked: private or internal address');
    return;
  }
  let addresses;
  try {
    addresses = await dns.promises.lookup(host, { all: true });
  } catch {
    throw new UrlNotAllowedError(`Could not resolve host ${host}`);
  }
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new UrlNotAllowedError(`Blocked: ${host} resolves to a non-public address`);
  }
}

// ---------------------------------------------------------------------------
// URL validation (synchronous, no network)
// ---------------------------------------------------------------------------
/**
 * Throws UrlNotAllowedError unless `raw` is an https URL on an allowed store host.
 * Returns the parsed URL and the platform inferred from its host.
 */
export function assertAllowedUrl(raw) {
  const text = String(raw ?? '').trim();
  if (!text) throw new UrlNotAllowedError('url is required');
  if (text.length > 2048) throw new UrlNotAllowedError('url is too long');

  let u;
  try {
    u = new URL(text);
  } catch {
    throw new UrlNotAllowedError('url must be a valid URL');
  }
  if (u.protocol !== 'https:') throw new UrlNotAllowedError('Only https:// links are allowed');
  if (u.username || u.password) throw new UrlNotAllowedError('Links with embedded credentials are not allowed');
  if (u.port && u.port !== '443') throw new UrlNotAllowedError('Custom ports are not allowed');

  const platform = platformForHost(u.hostname);
  if (!platform) {
    throw new UrlNotAllowedError('Only Amazon (amazon.in / amazon.com) and Flipkart (flipkart.com) links are supported');
  }
  return { url: u, platform };
}

// ---------------------------------------------------------------------------
// Normalisation: one canonical URL + identity key per product
// ---------------------------------------------------------------------------
const AMAZON_ASIN_RE = /\/(?:dp|gp\/product|gp\/aw\/d|product|exec\/obidos\/ASIN)\/([A-Za-z0-9]{10})(?=[/?#]|$)/;
const FLIPKART_ITM_RE = /\/p\/(itm[a-z0-9]+)/i;

/**
 * Validate and normalise a product link.
 * @returns {{ url: string, platform: 'amazon'|'flipkart', productKey: string }}
 *   url         clean fetchable URL (tracking parameters removed)
 *   productKey  stable identity used to prevent duplicates (e.g. "amazon.in:B0CAROL001")
 */
export function normalizeProductUrl(raw, expectedPlatform) {
  const { url: u, platform } = assertAllowedUrl(raw);
  if (expectedPlatform && String(expectedPlatform).toLowerCase() !== platform) {
    throw new UrlNotAllowedError(
      `This link belongs to ${platform === 'amazon' ? 'Amazon' : 'Flipkart'}, but ${expectedPlatform} was selected`
    );
  }

  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  const isShort = AMAZON_SHORT_HOSTS.includes(host) || FLIPKART_SHORT_HOSTS.includes(host);

  if (isShort) {
    // Short links are resolved (safely) when scraped; dedupe on the exact short URL.
    if (u.pathname.length <= 1) throw new UrlNotAllowedError('This short link has no product in it');
    const clean = `https://${host}${u.pathname}`;
    return { url: clean, platform, productKey: `url:${clean}` };
  }

  if (platform === 'amazon') {
    const m = u.pathname.match(AMAZON_ASIN_RE);
    if (!m) {
      throw new UrlNotAllowedError('This does not look like an Amazon product page. Open the product and copy its link (it contains /dp/XXXXXXXXXX)');
    }
    const asin = m[1].toUpperCase();
    const tld = AMAZON_DOMAINS.find((d) => isDomainOrSub(host, d));
    return { url: `https://www.${tld}/dp/${asin}`, platform, productKey: `${tld}:${asin}` };
  }

  // Flipkart
  const itm = u.pathname.match(FLIPKART_ITM_RE);
  const pid = (u.searchParams.get('pid') || '').trim();
  if (!itm) {
    throw new UrlNotAllowedError('This does not look like a Flipkart product page. Open the product and copy its link (it contains /p/itm…)');
  }
  if (pid && !/^[A-Za-z0-9]{8,32}$/.test(pid)) throw new UrlNotAllowedError('The Flipkart product id in this link is invalid');
  const path = u.pathname.replace(/\/+$/, '');
  const clean = `https://www.flipkart.com${path}${pid ? `?pid=${pid}` : ''}`;
  return { url: clean, platform, productKey: `flipkart:${(pid || itm[1]).toUpperCase()}` };
}

/** Lenient variant for backfilling rows that were saved before validation existed. */
export function legacyProductKey(rawUrl, platform) {
  try {
    return normalizeProductUrl(rawUrl, platform).productKey;
  } catch {
    try {
      const u = new URL(rawUrl);
      return `url:${u.origin}${u.pathname}`.toLowerCase();
    } catch {
      return null;
    }
  }
}
