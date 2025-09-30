import express from 'express';
import {
  getDashboard,
  getProfile,
  updateProfile,
  getStats,
  getInsights,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getStats);
router.get('/insights', getInsights);

export default router;
