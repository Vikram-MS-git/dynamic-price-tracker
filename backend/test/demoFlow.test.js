import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import pool from '../src/config/db.js';

let server, base, token, userId;

test('SETUP: start test server and register test demo user', async () => {
  const app = createApp();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;

  const email = `demo-tutor-${Date.now()}@example.com`;
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tutor Demo', email, password: 'password123' }),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.token);
  token = data.token;
  userId = data.user.id;
});

test('DEMO: seedAcademicDemoDataset creates 3 groups with simulated prices', async () => {
  const res = await fetch(`${base}/demo/seed`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(res.status, 200);

  // Check products
  const pRes = await fetch(`${base}/products`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(pRes.status, 200);
  const products = await pRes.json();
  assert.ok(products.length >= 6, `Expected at least 6 demo products, got ${products.length}`);

  // Check groups
  const gRes = await fetch(`${base}/groups`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(gRes.status, 200);
  const groups = await gRes.json();
  assert.ok(groups.length >= 3, `Expected at least 3 groups, got ${groups.length}`);

  // Test comparison
  const cRes = await fetch(`${base}/groups/${groups[0].id}/compare`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(cRes.status, 200);
  const comp = await cRes.json();
  assert.ok(comp.series.length >= 2, 'Compare should return at least 2 series (Amazon + Flipkart)');
  assert.ok(comp.stats.length >= 2, 'Compare should return at least 2 stats rows');
  assert.ok(comp.series[0].points[0].is_simulated, 'Points should be flagged as simulated');
});

test('ALERTS: persistent database alerts and trigger test drop', async () => {
  // Check alerts
  const aRes = await fetch(`${base}/alerts`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(aRes.status, 200);
  const alerts = await aRes.json();
  assert.ok(alerts.length > 0, 'Expected seeded alert');

  const alert = alerts[0];
  const dropRes = await fetch(`${base}/alerts/${alert.product_id}/trigger-test-drop`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(dropRes.status, 200);
  const dropData = await dropRes.json();
  assert.ok(dropData.alertTriggered || dropData.price <= alert.target_price);

  // Re-fetch alerts to verify triggered state
  const updatedRes = await fetch(`${base}/alerts`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const updatedAlerts = await updatedRes.json();
  const matched = updatedAlerts.find((a) => a.product_id === alert.product_id);
  assert.equal(matched.is_triggered, true, 'Alert should be triggered');
});

test('CLEANUP: reset demo dataset safely deletes demo products', async () => {
  const rRes = await fetch(`${base}/demo/reset`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(rRes.status, 200);

  // Clean up test user row
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);

  server.close();
  await pool.end();
});
