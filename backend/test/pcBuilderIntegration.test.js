import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import pool, { query } from '../src/config/db.js';

let app;
let server;
let baseUrl;
let token;
let userId;

test('SETUP: start test server and create test user for PC builder', async () => {
  app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const testEmail = `pcbuilder_test_${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'PC Builder Tester', email: testEmail, password: 'password123' }),
  });
  assert.strictEqual(regRes.status, 201);
  const data = await regRes.json();
  token = data.token;
  userId = data.user.id;
  assert.ok(token, 'Should acquire JWT token');
});

test('PC BUILDER API: get catalog and test recommendations', async () => {
  const catRes = await fetch(`${baseUrl}/pc-builder/catalog`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(catRes.status, 200);
  const catData = await catRes.json();
  assert.ok(catData.catalog.cpu.length > 0);
  assert.ok(catData.categories.includes('gpu'));

  const recRes = await fetch(`${baseUrl}/pc-builder/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      useCase: '1080p_gaming',
      budget: 65000,
      brandPreference: 'any',
    }),
  });
  assert.strictEqual(recRes.status, 200);
  const recData = await recRes.json();
  assert.ok(recData.recommendations.length > 0);
});

test('PC BUILDER API: save build, list builds, track components in tracker, and delete', async () => {
  const testComponents = {
    cpu: { id: 'cpu-r5-5600', name: 'AMD Ryzen 5 5600', priceAmazon: 11499, priceFlipkart: 11899, tdp: 65, urlAmazon: 'https://www.amazon.in/dp/B09VCHR1VH' },
    gpu: { id: 'gpu-rx-6600', name: 'AMD Radeon RX 6600 8GB', priceAmazon: 19499, priceFlipkart: 19999, tdp: 132, urlAmazon: 'https://www.amazon.in/dp/B09HHLX543' },
  };

  // 1. Create Build
  const createRes = await fetch(`${baseUrl}/pc-builder/builds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'My Custom Ryzen Rig',
      description: 'Budget 1080p gaming build',
      useCase: '1080p_gaming',
      components: testComponents,
      totalPrice: 30998,
      estimatedWattage: 267,
    }),
  });
  assert.strictEqual(createRes.status, 201);
  const savedBuild = await createRes.json();
  assert.strictEqual(savedBuild.name, 'My Custom Ryzen Rig');

  // 2. List Builds
  const listRes = await fetch(`${baseUrl}/pc-builder/builds`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(listRes.status, 200);
  const builds = await listRes.json();
  assert.ok(builds.some((b) => b.id === savedBuild.id));

  // 3. Track Build Components in Price Tracker
  const trackRes = await fetch(`${baseUrl}/pc-builder/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: savedBuild.name,
      components: testComponents,
    }),
  });
  assert.strictEqual(trackRes.status, 200);
  const trackData = await trackRes.json();
  assert.strictEqual(trackData.success, true);
  assert.ok(trackData.trackedCount >= 2);
  assert.ok(trackData.group.name.includes('My Custom Ryzen Rig'));

  // 4. Verify products appear in the user's products list
  const prodRes = await fetch(`${baseUrl}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(prodRes.status, 200);
  const prods = await prodRes.json();
  assert.ok(prods.some((p) => p.name === 'AMD Ryzen 5 5600'));

  // 5. Delete Build
  const delRes = await fetch(`${baseUrl}/pc-builder/builds/${savedBuild.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(delRes.status, 200);
});

test('TEARDOWN: clean test data and close server', async () => {
  if (userId) {
    await query('DELETE FROM pc_builds WHERE user_id = $1', [userId]);
    await query('DELETE FROM products WHERE user_id = $1', [userId]);
    await query('DELETE FROM product_groups WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }
  if (server) {
    server.close();
  }
  await pool.end();
});
