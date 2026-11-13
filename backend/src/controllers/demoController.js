import * as demoService from '../services/demoService.js';

export async function seedDemo(req, res, next) {
  try {
    const result = await demoService.seedAcademicDemoDataset(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetDemo(req, res, next) {
  try {
    const result = await demoService.resetDemoDataset(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function simulatePrice(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    const { forceDrop, dropPercent } = req.body ?? {};
    const result = await demoService.simulatePriceForProduct(req.user.id, productId, {
      forceDrop: Boolean(forceDrop),
      dropPercent: dropPercent ? Number(dropPercent) : 10,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function simulateHistory(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    const { days, minPoints } = req.body ?? {};
    const result = await demoService.generatePriceHistoryForProduct(
      req.user.id,
      productId,
      days ? Number(days) : 14,
      minPoints ? Number(minPoints) : 16
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
