/**
 * API integration tests against a REAL PostgreSQL database.
 *
 * Needs a dedicated, disposable database (its tables are wiped!):
 *     CREATE DATABASE price_tracker_test;
 *     set TEST_DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/price_tracker_test
 *     npm test
 * Without TEST_DATABASE_URL these tests are skipped. They refuse to run unless the
 * database name contains "test", so your real data can never be touched.
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

const TEST_URL = process.env.TEST_DATABASE_URL;
const dbName = TEST_URL ? new URL(TEST_URL).pathname.replace('/', '') : '';
const enabled = Boolean(TEST_URL) && /test/i.test(dbName);
if (TEST_URL && !enabled) {
  console.error(`Refusing to run integration tests: database "${dbName}" does not look like a test database.`);
}
const opts = { skip: enabled ? false : 'set TEST_DATABASE_URL (database name must contain "test") to run' };

let server, base, pool, locks;
const j = (token) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, { method, headers: j(token), body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
const register = (name, email, password = 'password123') => call('POST', '/auth/register', { body: { name, email, password } });
const AMAZON = (asin) => `https://www.amazon.in/Some-Product/dp/${asin}/ref=sr_1_1?keywords=x&qid=1`;

before(async () => {
  if (!enabled) return;
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_URL;
  process.env.JWT_SECRET = 'integration-test-secret';
  process.env.SCRAPE_DELAY_MS = '0';
  pool = (await import('../src/config/db.js')).default;
  const { runMigrations } = await import('../src/db/migrate.js');
  await runMigrations(pool, () => {});
  await pool.query('TRUNCATE users, products, product_groups, price_history RESTART IDENTITY CASCADE');
  locks = await import('../src/services/scrapeLock.js');
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!enabled) return;
  await new Promise((r) => server.close(r));
  await pool.end();
});

test('health check responds', opts, async () => {
  const r = await call('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'ok');
});

test('security headers are set and x-powered-by is hidden', opts, async () => {
  const res = await fetch(base + '/health');
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.ok(res.headers.get('x-content-type-options'));
});

test('data routes reject missing, malformed and forged tokens', opts, async () => {
  for (const path of ['/products', '/groups', '/analytics/dashboard']) {
    assert.equal((await call('GET', path)).status, 401, path);
    assert.equal((await call('GET', path, { token: 'garbage' })).status, 401, path);
  }
});

test('registration validates input and rejects duplicate emails (case-insensitive)', opts, async () => {
  assert.equal((await register('A', 'bad', '123')).status, 400);
  const ok = await register('Alice', 'Alice@Example.com');
  assert.equal(ok.status, 201);
  assert.equal(ok.data.user.email, 'alice@example.com');
  assert.equal('password_hash' in ok.data.user, false);
  assert.equal('token_version' in ok.data.user, false);
  assert.equal((await register('Alice 2', 'alice@example.com')).status, 409);
});

test('login: correct password works, wrong password and unknown email give the same error', opts, async () => {
  const good = await call('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'password123' } });
  assert.equal(good.status, 200);
  assert.ok(good.data.token);
  const bad = await call('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'nope-nope' } });
  const unknown = await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'nope-nope' } });
  assert.equal(bad.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(bad.data.error, unknown.data.error);
});

test('SSRF: internal, non-https and foreign URLs are rejected and nothing is stored', opts, async () => {
  const { data: { token } } = await call('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'password123' } });
  for (const url of ['http://127.0.0.1:8099/secret', 'https://127.0.0.1/x', 'https://localhost/dp/B0CAROL001',
    'https://169.254.169.254/latest/meta-data/', 'file:///etc/passwd', 'https://evil.example.com/dp/B0CAROL001',
    'http://www.amazon.in/dp/B0CAROL001']) {
    const r = await call('POST', '/products', { token, body: { name: 'x', url, platform: 'amazon' } });
    assert.equal(r.status, 400, url);
  }
  const mismatch = await call('POST', '/products', { token, body: { name: 'x', url: AMAZON('B0CAROL001'), platform: 'flipkart' } });
  assert.equal(mismatch.status, 400);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products');
  assert.equal(rows[0].n, 0);
});

test('products: add normalises the URL and derives the platform; duplicates are refused', opts, async () => {
  const { data: { token } } = await call('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'password123' } });
  const first = await call('POST', '/products', { token, body: { name: 'Earbuds', url: AMAZON('b0carol001') } });
  assert.equal(first.status, 201);
  assert.equal(first.data.url, 'https://www.amazon.in/dp/B0CAROL001');
  assert.equal(first.data.platform, 'amazon');
  assert.equal(first.data.product_key, 'amazon.in:B0CAROL001');

  // Same product via a different link shape -> 409
  const dup = await call('POST', '/products', { token, body: { name: 'Earbuds again', url: 'https://amazon.in/gp/product/B0CAROL001?psc=1' } });
  assert.equal(dup.status, 409);
  assert.match(dup.data.error, /already tracking/i);

  const list = await call('GET', '/products', { token });
  assert.equal(list.data.length, 1);
});

test('per-user isolation: another user cannot read, scrape, delete or compare my data', opts, async () => {
  const { data: { token: a } } = await call('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'password123' } });
  const b = (await register('Bob', 'bob@example.com')).data.token;
  const aliceProduct = (await call('GET', '/products', { token: a })).data[0];

  assert.deepEqual((await call('GET', '/products', { token: b })).data, []);
  for (const [method, path] of [['GET', `/products/${aliceProduct.id}`], ['GET', `/products/${aliceProduct.id}/prices`],
    ['POST', `/products/${aliceProduct.id}/scrape`], ['DELETE', `/products/${aliceProduct.id}`]]) {
    assert.equal((await call(method, path, { token: b })).status, 404, `${method} ${path}`);
  }
  const groupId = aliceProduct.group_id;
  assert.equal((await call('GET', `/groups/${groupId}/compare`, { token: b })).status, 404);
  const useGroup = await call('POST', '/products', { token: b, body: { name: 'x', url: AMAZON('B0BOBPROD1'), groupId } });
  assert.equal(useGroup.status, 404);

  // Bob CAN track the same product Alice tracks: uniqueness is per user.
  const sameProduct = await call('POST', '/products', { token: b, body: { name: 'Earbuds', url: AMAZON('B0CAROL001') } });
  assert.equal(sameProduct.status, 201);

  // Alice's product still exists.
  assert.equal((await call('GET', `/products/${aliceProduct.id}`, { token: a })).status, 200);
});

test('persistence: deleting a product removes its price history (FK cascade)', opts, async () => {
  const { data: { token } } = await call('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'password123' } });
  const p = (await call('POST', '/products', { token, body: { name: 'To delete', url: AMAZON('B0DELETE01') } })).data;
  await pool.query(`INSERT INTO price_history (product_id, price) VALUES ($1, 100), ($1, 90)`, [p.id]);
  const prices = await call('GET', `/products/${p.id}/prices`, { token });
  assert.equal(prices.data.prices.length, 2);
  assert.equal((await call('DELETE', `/products/${p.id}`, { token })).status, 200);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM price_history WHERE product_id = $1', [p.id]);
  assert.equal(rows[0].n, 0);
});

test('refresh-all refuses to run twice at once (lock) and succeeds when free', opts, async () => {
  const { data: { token } } = await call('POST', '/auth/login', { body: { email: 'bob@example.com', password: 'password123' } });
  const me = (await call('GET', '/auth/me', { token })).data.user;
  locks.tryAcquire(`user:${me.id}`);
  const blocked = await call('POST', '/products/scrape-all', { token });
  assert.equal(blocked.status, 409);
  locks.release(`user:${me.id}`);

  locks.tryAcquire('all'); // a scheduled run in progress also blocks user refreshes
  assert.equal((await call('POST', '/products/scrape-all', { token })).status, 409);
  locks.release('all');
});

test('changing the password logs out other sessions but keeps this one', opts, async () => {
  const s1 = (await call('POST', '/auth/login', { body: { email: 'bob@example.com', password: 'password123' } })).data.token;
  const s2 = (await call('POST', '/auth/login', { body: { email: 'bob@example.com', password: 'password123' } })).data.token;
  assert.equal((await call('GET', '/auth/me', { token: s2 })).status, 200);

  const wrong = await call('PUT', '/auth/password', { token: s1, body: { currentPassword: 'wrong-pass', newPassword: 'newpassword1' } });
  assert.equal(wrong.status, 400);
  assert.equal((await call('GET', '/auth/me', { token: s2 })).status, 200, 'a failed attempt must not log anyone out');

  const changed = await call('PUT', '/auth/password', { token: s1, body: { currentPassword: 'password123', newPassword: 'newpassword1' } });
  assert.equal(changed.status, 200);
  assert.ok(changed.data.token);

  assert.equal((await call('GET', '/auth/me', { token: s1 })).status, 401, 'old token for the same device is revoked');
  assert.equal((await call('GET', '/auth/me', { token: s2 })).status, 401, 'other sessions are revoked');
  assert.equal((await call('GET', '/auth/me', { token: changed.data.token })).status, 200, 'fresh token works');
  const relog = await call('POST', '/auth/login', { body: { email: 'bob@example.com', password: 'newpassword1' } });
  assert.equal(relog.status, 200);
});

test('profile update refuses an email that belongs to someone else', opts, async () => {
  const { data: { token } } = await call('POST', '/auth/login', { body: { email: 'bob@example.com', password: 'newpassword1' } });
  assert.equal((await call('PATCH', '/auth/me', { token, body: { name: 'Bob B', email: 'alice@example.com' } })).status, 409);
  const ok = await call('PATCH', '/auth/me', { token, body: { name: 'Bob B', email: 'bobby@example.com' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.name, 'Bob B');
});

test('malformed JSON body returns 400, not a stack trace', opts, async () => {
  const res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
  assert.equal(res.status, 400);
});

test('migrations are tracked and re-running is a no-op', opts, async () => {
  const { runMigrations } = await import('../src/db/migrate.js');
  assert.deepEqual(await runMigrations(pool, () => {}), []);
  const { rows } = await pool.query('SELECT name FROM schema_migrations ORDER BY name');
  const names = rows.map((r) => r.name);
  for (const n of ['000_base_schema.sql', '005_users.sql', '006_product_key.js', '007_token_version.sql']) assert.ok(names.includes(n), n);
});

test('migration 006 keeps legacy duplicates (key left NULL), never deletes, and respects the unique index', opts, async () => {
  const { up } = await import('../src/db/migrations/006_product_key.js');
  const uid = (await pool.query(`SELECT id FROM users WHERE email = 'alice@example.com'`)).rows[0].id;
  // Rows as an old install would have them: no product_key.
  const ins = async (name) => (await pool.query(
    `INSERT INTO products (name, url, platform, user_id) VALUES ($1, 'https://www.amazon.in/dp/B0LEGACY01', 'amazon', $2) RETURNING id`, [name, uid])).rows[0].id;
  const older = await ins('legacy one');
  const newer = await ins('legacy two (duplicate)');
  const client = await pool.connect();
  try { await up(client); } finally { client.release(); }
  const rows = (await pool.query('SELECT id, product_key FROM products WHERE id = ANY($1) ORDER BY id', [[older, newer]])).rows;
  assert.equal(rows[0].product_key, 'amazon.in:B0LEGACY01', 'oldest keeps the key');
  assert.equal(rows[1].product_key, null, 'duplicate keeps NULL and still exists');
});
