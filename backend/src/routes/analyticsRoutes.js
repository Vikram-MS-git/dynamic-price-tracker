import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';

const router = Router();

router.get('/dashboard', analyticsController.getDashboard);

export default router;
