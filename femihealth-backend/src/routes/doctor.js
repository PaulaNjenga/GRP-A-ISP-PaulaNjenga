import express from 'express';
import {
  getDoctorStats,
  getDoctorPatients,
  getDoctorDiagnoses,
  getPredictionsForReview,
  reviewPrediction
} from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and require doctor or admin role
router.use(protect);
router.use(authorize('doctor', 'admin'));

// Doctor dashboard routes
router.get('/stats', getDoctorStats);
router.get('/patients', getDoctorPatients);
router.get('/diagnoses', getDoctorDiagnoses);
router.get('/predictions', getPredictionsForReview);
router.put('/predictions/:id/review', reviewPrediction);

export default router;
