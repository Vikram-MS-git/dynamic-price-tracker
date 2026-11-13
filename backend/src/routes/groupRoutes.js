import { Router } from 'express';
import * as groupController from '../controllers/groupController.js';

const router = Router();

router.get('/', groupController.listGroups);
router.get('/:id/compare', groupController.compareGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.post('/:id/assign', groupController.assignProduct);

export default router;
