import { Router } from 'express';
import {
  getCatalog,
  checkBuildCompatibility,
  getRecommendations,
  listBuilds,
  getBuild,
  createBuild,
  updateBuild,
  deleteBuild,
  trackBuildComponents,
} from '../controllers/pcBuilderController.js';

const router = Router();

router.get('/catalog', getCatalog);
router.post('/check-compatibility', checkBuildCompatibility);
router.post('/recommendations', getRecommendations);

router.get('/builds', listBuilds);
router.post('/builds', createBuild);
router.get('/builds/:id', getBuild);
router.put('/builds/:id', updateBuild);
router.delete('/builds/:id', deleteBuild);

router.post('/track', trackBuildComponents);

export default router;
