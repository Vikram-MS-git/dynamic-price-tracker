import { Router } from 'express';
import * as demoController from '../controllers/demoController.js';

const router = Router();

router.post('/seed', demoController.seedDemo);
router.post('/reset', demoController.resetDemo);
router.post('/simulate/:productId', demoController.simulatePrice);
router.post('/simulate-history/:productId', demoController.simulateHistory);

export default router;
