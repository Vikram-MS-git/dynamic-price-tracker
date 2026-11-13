import { Router } from 'express';
import * as alertController from '../controllers/alertController.js';

const router = Router();

router.get('/', alertController.listAlerts);
router.post('/', alertController.upsertAlert);
router.delete('/:productId', alertController.deleteAlert);
router.post('/:productId/trigger-test-drop', alertController.triggerDemoPriceDrop);

export default router;
