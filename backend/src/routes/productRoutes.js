import { Router } from 'express';
import * as productController from '../controllers/productController.js';

const router = Router();

router.post('/', productController.createProduct);
router.get('/', productController.listProducts);
router.post('/scrape-all', productController.scrapeAll);
router.get('/:id', productController.getProduct);
router.get('/:id/prices', productController.getProductPrices);
router.post('/:id/scrape', productController.scrapeOne);
router.delete('/:id', productController.deleteProduct);

export default router;
