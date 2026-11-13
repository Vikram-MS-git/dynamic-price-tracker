import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPONENT_CATALOG,
  checkCompatibility,
  calculateBuildTotals,
  recommendBuilds,
} from '../src/services/pcBuilderService.js';

test('PC Builder - Catalog has all essential categories', () => {
  const expectedCategories = ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case', 'cooler'];
  for (const cat of expectedCategories) {
    assert.ok(COMPONENT_CATALOG[cat], `Missing category: ${cat}`);
    assert.ok(COMPONENT_CATALOG[cat].length > 0, `Category ${cat} is empty`);
  }
});

test('PC Builder - Detects socket mismatch between CPU and Motherboard', () => {
  const am4Cpu = COMPONENT_CATALOG.cpu.find((c) => c.socket === 'AM4');
  const am5Mobo = COMPONENT_CATALOG.motherboard.find((m) => m.socket === 'AM5');

  assert.ok(am4Cpu);
  assert.ok(am5Mobo);

  const res = checkCompatibility({
    cpu: am4Cpu,
    motherboard: am5Mobo,
  });

  assert.strictEqual(res.isCompatible, false);
  assert.ok(res.issues.some((i) => i.toLowerCase().includes('socket mismatch')));
});

test('PC Builder - Detects RAM generation mismatch', () => {
  const am5Mobo = COMPONENT_CATALOG.motherboard.find((m) => m.ramType === 'DDR5');
  const ddr4Ram = COMPONENT_CATALOG.ram.find((r) => r.ramType === 'DDR4');

  assert.ok(am5Mobo);
  assert.ok(ddr4Ram);

  const res = checkCompatibility({
    motherboard: am5Mobo,
    ram: ddr4Ram,
  });

  assert.strictEqual(res.isCompatible, false);
  assert.ok(res.issues.some((i) => i.toLowerCase().includes('ram type incompatibility')));
});

test('PC Builder - Calculates wattage and flags under-powered PSU', () => {
  const highEndCpu = COMPONENT_CATALOG.cpu.find((c) => c.tdp >= 120);
  const highEndGpu = COMPONENT_CATALOG.gpu.find((g) => g.tdp >= 300);
  const weakPsu = { id: 'weak-psu', name: 'Tiny 300W PSU', wattage: 300, priceAmazon: 1500 };

  assert.ok(highEndCpu);
  assert.ok(highEndGpu);

  const res = checkCompatibility({
    cpu: highEndCpu,
    gpu: highEndGpu,
    psu: weakPsu,
  });

  assert.strictEqual(res.isCompatible, false);
  assert.ok(res.estimatedWattage > 300);
  assert.ok(res.issues.some((i) => i.toLowerCase().includes('under-power')));
});

test('PC Builder - Calculates totals and potential mixed savings', () => {
  const testComponents = {
    cpu: { priceAmazon: 10000, priceFlipkart: 11000 },
    gpu: { priceAmazon: 30000, priceFlipkart: 28000 },
  };

  const totals = calculateBuildTotals(testComponents);
  assert.strictEqual(totals.amazonTotal, 40000);
  assert.strictEqual(totals.flipkartTotal, 39000);
  // Mixed = 10000 (Amazon) + 28000 (Flipkart) = 38000
  assert.strictEqual(totals.bestMixedTotal, 38000);
  assert.strictEqual(totals.potentialSavings, 2000); // 40000 - 38000
});

test('PC Builder - Recommender generates valid, compatible builds for budgets', () => {
  const gamingRecs = recommendBuilds({ useCase: '1080p_gaming', budget: 60000, brandPreference: 'any' });
  assert.ok(gamingRecs.length > 0);

  for (const build of gamingRecs) {
    assert.ok(build.components.cpu);
    assert.ok(build.components.motherboard);
    assert.ok(build.components.ram);
    assert.ok(build.components.storage);
    assert.ok(build.components.psu);
    assert.strictEqual(build.compatibility.isCompatible, true);
    assert.ok(build.totals.bestMixedTotal > 0);
  }

  const flagshipRecs = recommendBuilds({ useCase: '4k_gaming', budget: 200000, brandPreference: 'intel' });
  assert.ok(flagshipRecs.length > 0);
  const flagship = flagshipRecs.find((b) => b.id === 'rec-4k-flagship');
  assert.ok(flagship);
  assert.strictEqual(flagship.components.cpu.brand, 'Intel');
  assert.strictEqual(flagship.compatibility.isCompatible, true);
});
