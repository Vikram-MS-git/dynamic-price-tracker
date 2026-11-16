import test from 'node:test';
import assert from 'node:assert/strict';
import { predictProductPrices } from '../src/services/predictionService.js';

test('Prediction Service - Generates 7-day forecast with realistic structure', () => {
  const product = { id: 10, name: 'Apple iPhone 18 Pro', platform: 'flipkart', latest_price: 164900 };
  const history = [
    { scraped_at: '2026-11-01T10:00:00Z', price: 168000 },
    { scraped_at: '2026-11-05T10:00:00Z', price: 166500 },
    { scraped_at: '2026-11-10T10:00:00Z', price: 165000 },
    { scraped_at: '2026-11-14T10:00:00Z', price: 164900 },
  ];

  const res = predictProductPrices(product, history, 162000, 7);

  assert.equal(res.productId, 10);
  assert.equal(res.currentPrice, 164900);
  assert.equal(res.forecastHorizonDays, 7);
  assert.equal(res.forecast.length, 7);
  assert.ok(['downward', 'stable', 'upward'].includes(res.trend));
  assert.ok(res.dropProbability >= 0 && res.dropProbability <= 100);
  assert.ok(res.confidenceScore >= 70 && res.confidenceScore <= 100);
  assert.ok(res.optimalBuyWindow.recommendation);
  assert.ok(res.optimalBuyWindow.window);
  assert.ok(res.optimalBuyWindow.reason);

  // Validate day-by-day forecast integrity
  res.forecast.forEach((f, idx) => {
    assert.equal(f.day, idx + 1);
    assert.ok(f.date);
    assert.ok(f.displayDate);
    assert.ok(f.predictedPrice > 0);
    assert.ok(f.lowerBound <= f.predictedPrice, `Day ${f.day}: lowerBound (${f.lowerBound}) must be <= predictedPrice (${f.predictedPrice})`);
    assert.ok(f.upperBound >= f.predictedPrice, `Day ${f.day}: upperBound (${f.upperBound}) must be >= predictedPrice (${f.predictedPrice})`);
    assert.ok(f.confidence >= 50 && f.confidence <= 100);
  });
});

test('Prediction Service - Intersects target price when alert is within reach', () => {
  const product = { id: 11, name: 'Noise ColorFit Pulse 2', platform: 'amazon', latest_price: 1800 };
  const history = [
    { scraped_at: '2026-11-08T10:00:00Z', price: 2199 },
    { scraped_at: '2026-11-10T10:00:00Z', price: 1999 },
    { scraped_at: '2026-11-12T10:00:00Z', price: 1850 },
    { scraped_at: '2026-11-14T10:00:00Z', price: 1800 },
  ];

  const targetAlert = 1750;
  const res = predictProductPrices(product, history, targetAlert, 7);

  assert.equal(res.productId, 11);
  assert.ok(res.predictedLowestPrice < 1850);
  assert.ok(res.dropProbability >= 50, 'Downward trend should yield >= 50% drop probability');
});

test('Prediction Service - Handles products with zero or single history record gracefully', () => {
  const product = { id: 12, name: 'New Component', platform: 'flipkart', latest_price: 4999 };
  const history = [];

  const res = predictProductPrices(product, history, null, 7);

  assert.equal(res.productId, 12);
  assert.equal(res.currentPrice, 4999);
  assert.equal(res.forecast.length, 7);
  assert.ok(res.predictedLowestPrice > 0);
  res.forecast.forEach((f) => {
    assert.ok(f.lowerBound <= f.predictedPrice);
    assert.ok(f.upperBound >= f.predictedPrice);
  });
});
