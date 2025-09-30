import express from 'express';
import {
  uploadFile,
  uploadFiles,
  deleteFile,
  getFileInfo,
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.post('/upload-multiple', upload.array('files', 10), uploadFiles);
router.delete('/:fileId', deleteFile);
router.get('/:fileId', getFileInfo);

export default router;
