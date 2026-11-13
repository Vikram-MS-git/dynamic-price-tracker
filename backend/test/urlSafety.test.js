import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPrivateAddress, assertAllowedUrl, normalizeProductUrl, platformForHost, assertPublicHost, legacyProductKey,
} from '../src/services/urlSafety.js';

test('isPrivateAddress blocks loopback, private, link-local and reserved IPv4', () => {
  for (const ip of ['127.0.0.1', '127.1.2.3', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '169.254.169.254', '0.0.0.0', '100.64.0.1', '224.0.0.1', '255.255.255.255', '198.18.0.1']) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
});

test('isPrivateAddress allows public IPv4', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '23.45.67.89']) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test('isPrivateAddress handles IPv6 incl. mapped IPv4', () => {
  for (const ip of ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1', '::ffff:127.0.0.1',
    '::ffff:7f00:1', '::ffff:10.1.2.3', '::ffff:a9fe:a9fe', '64:ff9b::7f00:1', '2001:db8::1']) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ['2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:8.8.8.8']) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test('isPrivateAddress refuses things that are not IPs', () => {
  assert.equal(isPrivateAddress('not-an-ip'), true);
  assert.equal(isPrivateAddress(''), true);
});

test('assertPublicHost rejects IP literals that are internal without any DNS', async () => {
  for (const h of ['127.0.0.1', '[::1]', '169.254.169.254', '192.168.0.10']) {
    await assert.rejects(() => assertPublicHost(h), /non-public|private|internal/i, h);
  }
});

test('assertAllowedUrl rejects non-https, credentials, ports, foreign hosts, file and internal targets', () => {
  const bad = [
    'http://www.amazon.in/dp/B0CAROL001',
    'file:///etc/passwd',
    'ftp://www.amazon.in/x',
    'javascript:alert(1)',
    'https://user:pw@www.amazon.in/dp/B0CAROL001',
    'https://www.amazon.in:8443/dp/B0CAROL001',
    'https://127.0.0.1/dp/B0CAROL001',
    'https://localhost/x',
    'https://169.254.169.254/latest/meta-data/',
    'https://evil.com/amazon.in/dp/B0CAROL001',
    'https://amazon.in.evil.com/dp/B0CAROL001',
    'https://evilamazon.in/dp/B0CAROL001',
    'https://www.amazon.in@evil.com/dp/B0CAROL001',
    'https://flipkart.com.evil.io/x/p/itm123',
    '', '   ', 'not a url', 'https://www.amazon.in/' + 'a'.repeat(2100),
  ];
  for (const u of bad) assert.throws(() => assertAllowedUrl(u), /./, u.slice(0, 60));
});

test('assertAllowedUrl accepts store hosts and their subdomains', () => {
  for (const [u, p] of [
    ['https://www.amazon.in/dp/B0CAROL001', 'amazon'], ['https://amazon.com/dp/B0CAROL001', 'amazon'],
    ['https://m.amazon.in/dp/B0CAROL001', 'amazon'], ['https://amzn.in/d/abc123', 'amazon'],
    ['https://www.flipkart.com/x/p/itmabc123', 'flipkart'], ['https://dl.flipkart.com/s/abc', 'flipkart'],
    ['https://fkrt.it/abc123', 'flipkart'], ['https://WWW.AMAZON.IN./dp/B0CAROL001', 'amazon'],
  ]) assert.equal(assertAllowedUrl(u).platform, p, u);
});

test('platformForHost', () => {
  assert.equal(platformForHost('www.amazon.in'), 'amazon');
  assert.equal(platformForHost('www.flipkart.com'), 'flipkart');
  assert.equal(platformForHost('example.com'), null);
  assert.equal(platformForHost('notamazon.in'), null);
});

test('normalizeProductUrl: Amazon strips tracking and builds a stable key', () => {
  const a = normalizeProductUrl('https://www.amazon.in/Some-Long-Title/dp/b0carol001/ref=sr_1_3?keywords=x&qid=1&th=1');
  assert.equal(a.url, 'https://www.amazon.in/dp/B0CAROL001');
  assert.equal(a.productKey, 'amazon.in:B0CAROL001');
  const b = normalizeProductUrl('https://amazon.in/gp/product/B0CAROL001?psc=1');
  assert.equal(b.productKey, a.productKey, 'different link shapes of the same product share one key');
  const c = normalizeProductUrl('https://www.amazon.com/dp/B0CAROL001');
  assert.notEqual(c.productKey, a.productKey, 'amazon.com and amazon.in are different listings');
});

test('normalizeProductUrl: Flipkart keeps only pid and keys on it', () => {
  const a = normalizeProductUrl('https://www.flipkart.com/boat-rockerz/p/itm123abc?pid=ACCGZ5ABCDEF&lid=LSTX&otracker=search&marketplace=FLIPKART');
  assert.equal(a.url, 'https://www.flipkart.com/boat-rockerz/p/itm123abc?pid=ACCGZ5ABCDEF');
  assert.equal(a.productKey, 'flipkart:ACCGZ5ABCDEF');
  const b = normalizeProductUrl('https://www.flipkart.com/other-slug/p/itm123abc?pid=ACCGZ5ABCDEF');
  assert.equal(b.productKey, a.productKey);
});

test('normalizeProductUrl rejects search/listing pages and platform mismatch', () => {
  assert.throws(() => normalizeProductUrl('https://www.amazon.in/s?k=earbuds'), /product page/);
  assert.throws(() => normalizeProductUrl('https://www.flipkart.com/search?q=earbuds'), /product page/);
  assert.throws(() => normalizeProductUrl('https://www.amazon.in/dp/B0CAROL001', 'flipkart'), /belongs to Amazon/);
  assert.throws(() => normalizeProductUrl('https://www.flipkart.com/x/p/itm1?pid=bad!id'), /invalid/);
});

test('short links are allowed and keyed on the exact short URL', () => {
  const s = normalizeProductUrl('https://amzn.in/d/abc123?ref=x');
  assert.equal(s.url, 'https://amzn.in/d/abc123');
  assert.equal(s.productKey, 'url:https://amzn.in/d/abc123');
  assert.throws(() => normalizeProductUrl('https://amzn.in/'), /no product/);
});

test('legacyProductKey is lenient for rows saved before validation existed', () => {
  assert.equal(legacyProductKey('https://www.amazon.in/dp/demo-1', 'amazon'), 'url:https://www.amazon.in/dp/demo-1');
  assert.equal(legacyProductKey('https://www.amazon.in/dp/B0CAROL001', 'amazon'), 'amazon.in:B0CAROL001');
  assert.equal(legacyProductKey('garbage', 'amazon'), null);
});
