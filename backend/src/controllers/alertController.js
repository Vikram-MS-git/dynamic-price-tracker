import * as alertModel from '../models/alertModel.js';
import * as productModel from '../models/productModel.js';
import { simulatePriceForProduct } from '../services/demoService.js';

export async function listAlerts(req, res, next) {
  try {
    const alerts = await alertModel.getUserAlerts(req.user.id);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

export async function upsertAlert(req, res, next) {
  try {
    const { productId, targetPrice } = req.body ?? {};
    const pid = Number(productId);
    const target = Number(targetPrice);

    if (!Number.isInteger(pid) || pid < 1) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    if (!Number.isFinite(target) || target <= 0) {
      return res.status(400).json({ error: 'Target price must be greater than 0' });
    }

    const product = await productModel.getProductById(pid, req.user.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const alert = await alertModel.upsertAlert(req.user.id, pid, target);

    // If product already has a latest price, evaluate alert immediately
    if (product.latest_price != null) {
      await alertModel.checkAndTriggerAlert(req.user.id, pid, product.latest_price);
    }

    const updated = await alertModel.getAlertByProductId(req.user.id, pid);
    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteAlert(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    await alertModel.deleteAlert(req.user.id, productId);
    res.json({ message: 'Alert removed', productId });
  } catch (err) {
    next(err);
  }
}

export async function triggerDemoPriceDrop(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    const result = await simulatePriceForProduct(req.user.id, productId, { forceDrop: true });
    res.json({ message: 'Simulated price drop applied', ...result });
  } catch (err) {
    next(err);
  }
}
