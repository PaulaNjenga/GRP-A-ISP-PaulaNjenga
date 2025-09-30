import express from 'express';
import {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getSystemStats,
  getPredictions,
  getPredictionAnalytics,
  getActivityLogs,
  getSystemHealth,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin', 'doctor'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', authorize('admin'), updateUser);
router.delete('/users/:id', authorize('admin'), deleteUser);
router.get('/stats', getSystemStats);
router.get('/predictions', getPredictions);
router.get('/analytics/predictions', getPredictionAnalytics);
router.get('/logs', getActivityLogs);
router.get('/health', getSystemHealth);

export default router;
