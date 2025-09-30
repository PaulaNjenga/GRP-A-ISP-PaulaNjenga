const express = require('express');
const multer = require('multer');
const path = require('path');
const { User, Prediction, USER_ROLES } = require('../models/UserMongoDB');
const { RBACMiddleware, requireDiagnose, requireViewPatientData } = require('../middleware/rbac');
const { calculatePCOSRisk, analyzeImage, generateRecommendations } = require('../utils/mlModel');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/medical/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow medical images and documents
    const allowedTypes = /jpeg|jpg|png|dicom|dcm|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only medical images and documents are allowed'));
    }
  }
});

// Middleware to ensure user is a verified doctor
router.use(RBACMiddleware.requireVerifiedDoctor());

// Get doctor's patients
router.get('/patients', requireViewPatientData(), async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get all predictions made by this doctor
    const doctorPredictions = Prediction.getAll({ doctorId });
    
    // Extract unique patient IDs
    const patientIds = [...new Set(doctorPredictions.map(p => p.userId))];
    
    // Get patient information (anonymized for privacy)
    const patients = patientIds.map(patientId => {
      const user = User.findById(patientId);
      if (!user) return null;
      
      return {
        id: user.id,
        anonymousId: user.anonymousId,
        ageGroup: user.getAgeGroup(),
        heightRange: user.getHeightRange(),
        weightRange: user.getWeightRange(),
        lastVisit: doctorPredictions
          .filter(p => p.userId === patientId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.createdAt,
        totalVisits: doctorPredictions.filter(p => p.userId === patientId).length,
        riskLevel: doctorPredictions
          .filter(p => p.userId === patientId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.risk || 0
      };
    }).filter(Boolean);

    res.json({
      success: true,
      patients,
      total: patients.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
});

// Get patient details for diagnosis
router.get('/patients/:patientId', requireViewPatientData(), async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const patient = User.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get patient's prediction history with this doctor
    const predictions = Prediction.findByUserId(patientId)
      .filter(p => p.doctorId === req.user.id)
      .map(p => p.toDoctorView());

    res.json({
      success: true,
      patient: {
        id: patient.id,
        anonymousId: patient.anonymousId,
        ageGroup: patient.getAgeGroup(),
        heightRange: patient.getHeightRange(),
        weightRange: patient.getWeightRange(),
        medicalHistory: patient.medicalHistory,
        medications: patient.medications,
        allergies: patient.allergies
      },
      predictions,
      totalPredictions: predictions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient details',
      error: error.message
    });
  }
});

// Create diagnosis with test results and images
router.post('/diagnosis', requireDiagnose(), upload.fields([
  { name: 'ultrasound', maxCount: 5 },
  { name: 'testResults', maxCount: 10 },
  { name: 'documents', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      patientId,
      inputData,
      testResults,
      clinicalNotes,
      diagnosis,
      treatmentPlan,
      followUpDate
    } = req.body;

    // Validate patient exists
    const patient = User.findById(parseInt(patientId));
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Process uploaded files
    const attachments = [];
    if (req.files) {
      Object.keys(req.files).forEach(fieldname => {
        req.files[fieldname].forEach(file => {
          attachments.push({
            type: fieldname,
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          });
        });
      });
    }

    // Parse input data and test results
    const parsedInputData = typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
    const parsedTestResults = typeof testResults === 'string' ? JSON.parse(testResults) : testResults;

    // Calculate PCOS risk using ML model
    const riskResult = calculatePCOSRisk(parsedInputData);
    
    // Analyze ultrasound images if provided
    let imageAnalysis = null;
    const ultrasoundFiles = req.files?.ultrasound || [];
    if (ultrasoundFiles.length > 0) {
      imageAnalysis = analyzeImage(ultrasoundFiles[0].path, parsedInputData);
    }

    // Generate recommendations
    const recommendations = generateRecommendations(riskResult.risk, riskResult.factors, parsedTestResults);

    // Create prediction record
    const predictionData = {
      userId: parseInt(patientId),
      doctorId: req.user.id,
      type: ultrasoundFiles.length > 0 ? 'multimodal' : 'tabular',
      purpose: 'diagnosis',
      inputData: parsedInputData,
      risk: riskResult.risk,
      confidence: riskResult.confidence,
      factors: riskResult.factors,
      recommendations,
      imageAnalysis,
      testResults: parsedTestResults,
      clinicalNotes,
      diagnosis,
      treatmentPlan,
      followUpDate,
      attachments
    };

    const prediction = Prediction.create(predictionData);

    res.json({
      success: true,
      message: 'Diagnosis created successfully',
      prediction: prediction.toDoctorView(),
      attachments: attachments.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create diagnosis',
      error: error.message
    });
  }
});

// Update existing diagnosis
router.put('/diagnosis/:predictionId', requireDiagnose(), async (req, res) => {
  try {
    const predictionId = parseInt(req.params.predictionId);
    const prediction = Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis not found'
      });
    }

    // Verify doctor owns this diagnosis
    if (prediction.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify another doctor\'s diagnosis'
      });
    }

    const {
      testResults,
      clinicalNotes,
      diagnosis,
      treatmentPlan,
      followUpDate
    } = req.body;

    // Update prediction
    Object.assign(prediction, {
      testResults: testResults || prediction.testResults,
      clinicalNotes: clinicalNotes || prediction.clinicalNotes,
      diagnosis: diagnosis || prediction.diagnosis,
      treatmentPlan: treatmentPlan || prediction.treatmentPlan,
      followUpDate: followUpDate || prediction.followUpDate,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Diagnosis updated successfully',
      prediction: prediction.toDoctorView()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update diagnosis',
      error: error.message
    });
  }
});

// Get doctor's diagnosis history
router.get('/diagnoses', requireDiagnose(), async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, riskLevel } = req.query;
    const offset = (page - 1) * limit;

    let diagnoses = Prediction.getAll({ doctorId: req.user.id });

    // Filter by patient if specified
    if (patientId) {
      diagnoses = diagnoses.filter(d => d.userId === parseInt(patientId));
    }

    // Filter by risk level if specified
    if (riskLevel) {
      const riskThresholds = {
        low: [0, 0.3],
        moderate: [0.3, 0.7],
        high: [0.7, 1]
      };
      
      if (riskThresholds[riskLevel]) {
        const [min, max] = riskThresholds[riskLevel];
        diagnoses = diagnoses.filter(d => d.risk >= min && d.risk < max);
      }
    }

    const total = diagnoses.length;
    const paginatedDiagnoses = diagnoses
      .slice(offset, offset + parseInt(limit))
      .map(d => d.toDoctorView());

    res.json({
      success: true,
      diagnoses: paginatedDiagnoses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch diagnoses',
      error: error.message
    });
  }
});

// Get doctor statistics
router.get('/stats', async (req, res) => {
  try {
    const doctorId = req.user.id;
    const doctorPredictions = Prediction.getAll({ doctorId });

    const stats = {
      totalDiagnoses: doctorPredictions.length,
      totalPatients: [...new Set(doctorPredictions.map(p => p.userId))].length,
      riskDistribution: {
        low: doctorPredictions.filter(p => p.risk < 0.3).length,
        moderate: doctorPredictions.filter(p => p.risk >= 0.3 && p.risk < 0.7).length,
        high: doctorPredictions.filter(p => p.risk >= 0.7).length
      },
      thisMonth: doctorPredictions.filter(p => {
        const predictionDate = new Date(p.createdAt);
        const now = new Date();
        return predictionDate.getMonth() === now.getMonth() && 
               predictionDate.getFullYear() === now.getFullYear();
      }).length,
      averageRisk: doctorPredictions.length > 0 ? 
        doctorPredictions.reduce((sum, p) => sum + p.risk, 0) / doctorPredictions.length : 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor statistics',
      error: error.message
    });
  }
});

// Upload additional files to existing diagnosis
router.post('/diagnosis/:predictionId/files', requireDiagnose(), upload.array('files', 10), async (req, res) => {
  try {
    const predictionId = parseInt(req.params.predictionId);
    const prediction = Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis not found'
      });
    }

    // Verify doctor owns this diagnosis
    if (prediction.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify another doctor\'s diagnosis'
      });
    }

    // Process uploaded files
    const newAttachments = req.files.map(file => ({
      type: 'additional',
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString()
    }));

    // Add to existing attachments
    prediction.attachments = [...(prediction.attachments || []), ...newAttachments];
    prediction.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      newFiles: newAttachments.length,
      totalFiles: prediction.attachments.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
});

module.exports = router;
