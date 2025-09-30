import express from 'express';
import {
  exportPDF,
  exportCSV,
  exportDashboard,
} from '../controllers/exportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/pdf/:reportId', exportPDF);
router.get('/csv/:dataType', exportCSV);
router.get('/dashboard', exportDashboard);

export default router;
