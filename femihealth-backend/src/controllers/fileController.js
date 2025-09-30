import fs from 'fs';
import path from 'path';

// @desc    Upload single file
// @route   POST /api/files/upload
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    res.json({
      success: true,
      file: {
        id: req.file.filename,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload multiple files
// @route   POST /api/files/upload-multiple
// @access  Private
export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload files' });
    }

    const files = req.files.map(file => ({
      id: file.filename,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
    }));

    res.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:fileId
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', fileId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get file info
// @route   GET /api/files/:fileId
// @access  Private
export const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', fileId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      file: {
        id: fileId,
        filename: fileId,
        size: stats.size,
        createdAt: stats.birthtime,
        path: `/uploads/${fileId}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
