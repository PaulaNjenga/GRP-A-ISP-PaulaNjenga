import express from 'express';
import {
  predictTabular,
  predictImage,
  predictMultimodal,
  getResult,
  getHistory,
} from '../controllers/predictionController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/tabular', predictTabular);
router.post('/image', upload.single('image'), predictImage);
router.post('/multimodal', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'ultrasound_image', maxCount: 1 }
]), predictMultimodal);
router.get('/result/:id', getResult);
router.get('/history', getHistory);

export default router;
