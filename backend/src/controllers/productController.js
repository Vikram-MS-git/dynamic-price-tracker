import * as productService from '../services/productService.js';
import { runScrapeJob } from '../jobs/scheduler.js';

export async function createProduct(req, res, next) {
  try {
    const errors = productService.validateProductInput(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const product = await productService.addProduct(req.user.id, req.body);
    res.status(201).json(product);
    productService.scrapeProductById(req.user.id, product.id).catch((err) => {
      console.warn(`[create] Background scrape for product ${product.id}:`, err.message);
    });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req, res, next) {
  try {
    const products = await productService.listProducts(req.user.id);
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const product = await productService.getProduct(req.user.id, id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function getProductPrices(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const result = await productService.getProductPrices(req.user.id, id, {
      from: req.query.from,
      to: req.query.to,
    });
    if (!result) return res.status(404).json({ error: 'Product not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function scrapeAll(req, res, next) {
  try {
    const summary = await runScrapeJob({ userId: req.user.id });
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function scrapeOne(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const result = await productService.scrapeProductById(req.user.id, id);
    if (!result) return res.status(404).json({ error: 'Product not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const deleted = await productService.removeProduct(req.user.id, id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', id: deleted.id });
  } catch (err) {
    next(err);
  }
}
