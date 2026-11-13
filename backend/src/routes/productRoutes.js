import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as productController from '../controllers/productController.js';

const router = Router();

// Limits are per logged-in user (these routes always sit behind requireAuth).
const perUser = (opts) =>
  rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `user-${req.user.id}`,
    validate: { keyGeneratorIpFallback: false },
    message: { error: opts.message },
  });

const addLimiter = perUser({ windowMs: 60 * 60 * 1000, limit: 60, message: 'Too many products added. Try again later.' });
const scrapeOneLimiter = perUser({ windowMs: 15 * 60 * 1000, limit: 60, message: 'Too many refresh requests. Try again in a few minutes.' });
const scrapeAllLimiter = perUser({ windowMs: 15 * 60 * 1000, limit: 6, message: 'Too many "refresh all" requests. Try again in a few minutes.' });

router.post('/', addLimiter, productController.createProduct);
router.get('/', productController.listProducts);
router.post('/scrape-all', scrapeAllLimiter, productController.scrapeAll);
router.get('/:id', productController.getProduct);
router.get('/:id/prices', productController.getProductPrices);
router.post('/:id/scrape', scrapeOneLimiter, productController.scrapeOne);
router.post('/:id/simulate', productController.simulateOne);
router.post('/:id/simulate-history', productController.simulateHistory);
router.delete('/:id', productController.deleteProduct);

export default router;
