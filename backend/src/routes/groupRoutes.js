import { Router } from 'express';
import * as groupController from '../controllers/groupController.js';

const router = Router();

router.get('/', groupController.listGroups);
router.get('/:id/compare', groupController.compareGroup);

export default router;
