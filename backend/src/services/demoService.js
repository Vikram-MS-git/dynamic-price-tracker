import * as productModel from '../models/productModel.js';
import * as groupModel from '../models/groupModel.js';
import * as alertModel from '../models/alertModel.js';
import { query } from '../config/db.js';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getBaselineByCategory(category = '', name = '', existingPrice = null) {
  if (existingPrice && Number(existingPrice) > 0) return Number(existingPrice);
  const text = `${category} ${name}`.toLowerCase();
  if (text.includes('iphone') || text.includes('pro max') || text.includes('ultra') || text.includes('flagship')) {
    return 149999;
  }
  if (text.includes('laptop') || text.includes('macbook')) {
    return 69999;
  }
  if (text.includes('phone') || text.includes('tablet') || text.includes('mobile')) {
    return 29999;
  }
  if (text.includes('headphone') || text.includes('earbud') || text.includes('audio') || text.includes('rockerz')) {
    return 1499;
  }
  if (text.includes('watch') || text.includes('band') || text.includes('pulse')) {
    return 1999;
  }
  if (text.includes('case') || text.includes('cover') || text.includes('protector')) {
    return 399;
  }
  if (text.includes('power bank') || text.includes('charger') || text.includes('cable')) {
    return 899;
  }
  return 2499;
}

export async function simulatePriceForProduct(userId, productId, { forceDrop = false, dropPercent = 10 } = {}) {
  const product = await productModel.getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  const history = await productModel.getPriceHistory(productId);
  const lastPrice = history.length ? Number(history[history.length - 1].price) : getBaselineByCategory(product.category, product.name);

  let newPrice;
  if (forceDrop) {
    const alert = await alertModel.getAlertByProductId(userId, productId);
    if (alert && alert.target_price) {
      newPrice = Math.max(1, Math.round(Number(alert.target_price) * 0.96));
    } else {
      newPrice = Math.max(1, Math.round(lastPrice * (1 - dropPercent / 100)));
    }
  } else {
    // Realistic fluctuation between -4% and +4%
    const variation = randomBetween(-0.04, 0.04);
    newPrice = Math.max(1, Math.round(lastPrice * (1 + variation)));
  }

  const scrapedAt = new Date().toISOString();
  const row = await productModel.insertPriceHistory({
    productId: product.id,
    price: newPrice,
    currency: 'INR',
    scrapedAt,
    isSimulated: true,
    simulationLabel: forceDrop ? 'simulated_drop' : 'simulated',
  });

  await productModel.setScrapeError(product.id, 'Live store rate-limited; simulated demo price applied.');

  // Check server-side alerts
  const alertResult = await alertModel.checkAndTriggerAlert(userId, product.id, newPrice);

  return {
    productId: product.id,
    name: product.name,
    platform: product.platform,
    price: row.price,
    scrapedAt: row.scraped_at,
    isSimulated: true,
    simulationLabel: row.simulation_label,
    alertTriggered: Boolean(alertResult?.justTriggered),
  };
}

export async function generatePriceHistoryForProduct(userId, productId, days = 14, minPoints = 16) {
  const product = await productModel.getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  const history = await productModel.getPriceHistory(productId);
  const existingPrice = history.length
    ? Number(history[history.length - 1].price)
    : (product.latest_price ? Number(product.latest_price) : null);

  const base = getBaselineByCategory(product.category, product.name, existingPrice);
  const now = Date.now();
  const inserted = [];

  for (let i = 0; i < minPoints; i += 1) {
    const dayOffset = ((minPoints - 1 - i) / minPoints) * days;
    const scrapedAt = new Date(now - dayOffset * 24 * 60 * 60 * 1000).toISOString();
    const variance = randomBetween(-0.04, 0.04);
    const price = Math.round(base * (1 + variance));

    const row = await productModel.insertPriceHistory({
      productId: product.id,
      price,
      currency: 'INR',
      scrapedAt,
      isSimulated: true,
      simulationLabel: 'demo_seed',
    });
    inserted.push(row);
  }

  // Update product image if empty
  if (!product.image_url) {
    const fallbackImage = product.platform === 'amazon'
      ? 'https://m.media-amazon.com/images/I/41K7C9jE8RL._SL500_.jpg'
      : 'https://rukminim2.flixcart.com/image/416/416/xif0q/headphone/p/r/z/rockerz-450-boat-original-imagq94yv2z4zhfg.jpeg';
    await productModel.updateProductImage(product.id, fallbackImage);
  }

  const latest = inserted[inserted.length - 1];
  await alertModel.checkAndTriggerAlert(userId, product.id, latest.price);

  return { count: inserted.length, latestPrice: latest.price };
}

export async function seedAcademicDemoDataset(userId) {
  const DEMO_SPECS = [
    {
      groupName: 'boAt Rockerz 450',
      category: 'Audio',
      amazon: {
        name: 'boAt Rockerz 450 Bluetooth On-Ear Headphones with Mic',
        url: 'https://www.amazon.in/dp/B07PR1CL3S',
        asin: 'B07PR1CL3S',
        basePrice: 1499,
        volatility: 0.12,
        image: 'https://m.media-amazon.com/images/I/51xxA+6E+xL._SL1500_.jpg',
      },
      flipkart: {
        name: 'boAt Rockerz 450 Bluetooth Headset (Luscious Black)',
        url: 'https://www.flipkart.com/boat-rockerz-450-bluetooth-headset/p/itmfc1234567890a?pid=ACCFK1234567890A',
        pid: 'ACCFK1234567890A',
        basePrice: 1299,
        volatility: 0.06,
        image: 'https://rukminim2.flixcart.com/image/416/416/kfmv9u80/headphone/z/b/c/rockerz-450-boat-original-imafwfo4z2ghzgz8.jpeg',
      },
      alertTarget: 1350,
    },
    {
      groupName: 'OnePlus Bullets Wireless Z2',
      category: 'Electronics',
      amazon: {
        name: 'OnePlus Bullets Wireless Z2 Bluetooth Neckband Earphones (Magico Black)',
        url: 'https://www.amazon.in/dp/B09TVVGXWS',
        asin: 'B09TVVGXWS',
        basePrice: 1799,
        volatility: 0.09,
        image: 'https://m.media-amazon.com/images/I/51UhwaQXCpL._SL1500_.jpg',
      },
      flipkart: {
        name: 'OnePlus Bullets Wireless Z2 Bluetooth Headset (Magico Black)',
        url: 'https://www.flipkart.com/oneplus-bullets-wireless-z2/p/itm789123456789b?pid=ACCFK7891234567B',
        pid: 'ACCFK7891234567B',
        basePrice: 1699,
        volatility: 0.07,
        image: 'https://rukminim2.flixcart.com/image/416/416/l1mh7rk0/headphone/b/s/m/bullets-wireless-z2-oneplus-original-imagd55rjcg9mggy.jpeg',
      },
      alertTarget: 1650,
    },
    {
      groupName: 'Noise ColorFit Pulse 2',
      category: 'Wearables',
      amazon: {
        name: 'Noise ColorFit Pulse 2 Smart Watch with 1.8" Display (Jet Black)',
        url: 'https://www.amazon.in/dp/B0B5L5LRL2',
        asin: 'B0B5L5LRL2',
        basePrice: 1999,
        volatility: 0.15,
        image: 'https://m.media-amazon.com/images/I/61SSVxTSstL._SL1500_.jpg',
      },
      flipkart: {
        name: 'Noise ColorFit Pulse 2 1.80" Display Bluetooth Smartwatch',
        url: 'https://www.flipkart.com/noise-colorfit-pulse-2/p/itm45612378901c?pid=ACCFK4561237890C',
        pid: 'ACCFK4561237890C',
        basePrice: 1849,
        volatility: 0.08,
        image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/smartwatch/c/8/p/-original-imaghfuvj4q7yvhc.jpeg',
      },
      alertTarget: 1800,
    },
  ];

  const now = Date.now();
  const createdGroups = [];

  for (const spec of DEMO_SPECS) {
    let group = await groupModel.findGroupByName(spec.groupName, userId);
    if (!group) {
      group = await groupModel.createGroup({ name: spec.groupName, category: spec.category, userId });
    }
    createdGroups.push(group);

    // Create or find Amazon product
    let amz = await query(
      `SELECT * FROM products WHERE user_id = $1 AND group_id = $2 AND platform = 'amazon' LIMIT 1`,
      [userId, group.id]
    );
    let amzProduct = amz.rows[0];
    if (!amzProduct) {
      amzProduct = await productModel.createProduct({
        name: spec.amazon.name,
        url: spec.amazon.url,
        platform: 'amazon',
        category: spec.category,
        groupId: group.id,
        userId,
        productKey: `amazon.in:${spec.amazon.asin}`,
        isDemo: true,
      });
      await productModel.updateProductImage(amzProduct.id, spec.amazon.image);
    }

    // Create or find Flipkart product
    let fk = await query(
      `SELECT * FROM products WHERE user_id = $1 AND group_id = $2 AND platform = 'flipkart' LIMIT 1`,
      [userId, group.id]
    );
    let fkProduct = fk.rows[0];
    if (!fkProduct) {
      fkProduct = await productModel.createProduct({
        name: spec.flipkart.name,
        url: spec.flipkart.url,
        platform: 'flipkart',
        category: spec.category,
        groupId: group.id,
        userId,
        productKey: `flipkart:${spec.flipkart.pid}`,
        isDemo: true,
      });
      await productModel.updateProductImage(fkProduct.id, spec.flipkart.image);
    }

    // Seed 16 points for Amazon
    const { rows: amzPoints } = await query(
      `SELECT COUNT(*)::int AS count FROM price_history WHERE product_id = $1`,
      [amzProduct.id]
    );
    if (amzPoints[0].count < 10) {
      for (let i = 0; i < 16; i += 1) {
        const offset = ((15 - i) / 16) * 14;
        const time = new Date(now - offset * 24 * 60 * 60 * 1000).toISOString();
        const variance = randomBetween(-spec.amazon.volatility, spec.amazon.volatility);
        const price = Math.round(spec.amazon.basePrice * (1 + variance));
        await productModel.insertPriceHistory({
          productId: amzProduct.id,
          price,
          currency: 'INR',
          scrapedAt: time,
          isSimulated: true,
          simulationLabel: 'demo_seed',
        });
      }
    }

    // Seed 16 points for Flipkart
    const { rows: fkPoints } = await query(
      `SELECT COUNT(*)::int AS count FROM price_history WHERE product_id = $1`,
      [fkProduct.id]
    );
    if (fkPoints[0].count < 10) {
      for (let i = 0; i < 16; i += 1) {
        const offset = ((15 - i) / 16) * 14;
        const time = new Date(now - offset * 24 * 60 * 60 * 1000).toISOString();
        const variance = randomBetween(-spec.flipkart.volatility, spec.flipkart.volatility);
        const price = Math.round(spec.flipkart.basePrice * (1 + variance));
        await productModel.insertPriceHistory({
          productId: fkProduct.id,
          price,
          currency: 'INR',
          scrapedAt: time,
          isSimulated: true,
          simulationLabel: 'demo_seed',
        });
      }
    }

    // Set up a sample alert on Flipkart product
    if (spec.alertTarget) {
      const { rows: lastFk } = await query(
        `SELECT price FROM price_history WHERE product_id = $1 ORDER BY scraped_at DESC LIMIT 1`,
        [fkProduct.id]
      );
      const currentFkPrice = lastFk[0] ? Number(lastFk[0].price) : spec.flipkart.basePrice;
      await alertModel.upsertAlert(userId, fkProduct.id, spec.alertTarget);
      await alertModel.checkAndTriggerAlert(userId, fkProduct.id, currentFkPrice);
    }
  }

  return { message: 'Academic demo dataset seeded successfully', groups: createdGroups.length };
}

export async function resetDemoDataset(userId) {
  // Safe: only deletes products where is_demo = true for this user
  const deleted = await productModel.deleteDemoProducts(userId);

  // Clean up any empty groups belonging to this user
  await query(
    `DELETE FROM product_groups
     WHERE user_id = $1
       AND id NOT IN (SELECT DISTINCT group_id FROM products WHERE user_id = $1 AND group_id IS NOT NULL)`,
    [userId]
  );

  return { message: 'Demo products safely cleared', deletedCount: deleted.length };
}
