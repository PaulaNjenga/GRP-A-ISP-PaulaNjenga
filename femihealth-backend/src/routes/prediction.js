import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import Prediction from '../models/Prediction.js';

const router = express.Router();

// ML Service URL (update based on your deployment)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * @route   POST /api/prediction/pcos
 * @desc    Predict PCOS risk using ML service
 * @access  Private
 */
router.post('/pcos', protect, async (req, res) => {
  try {
    const { clinical, image_base64 } = req.body;

    // Validate clinical data
    if (!clinical) {
      return res.status(400).json({
        success: false,
        message: 'Clinical data is required'
      });
    }

    // Required fields validation
    const requiredFields = [
      'Age (yrs)',
      'Weight (Kg)',
      'Height(Cm)',
      'Cycle length(days)',
      'Weight gain(Y/N)',
      'hair growth(Y/N)',
      'Skin darkening (Y/N)',
      'Pimples(Y/N)',
      'Fast food (Y/N)',
      'Reg.Exercise(Y/N)'
    ];

    const missingFields = requiredFields.filter(field => !(field in clinical));
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing_fields: missingFields
      });
    }

    // Prepare payload for ML service
    const payload = {
      clinical,
      ...(image_base64 && { image_base64 })
    };

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      payload,
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Save prediction to database
    const predictionData = {
      user: req.user._id,
      type: image_base64 ? 'multimodal' : 'tabular',
      inputData: {
        ...clinical,
        ...(image_base64 && { imageUrl: 'base64_image' })
      },
      result: {
        prediction: mlResponse.data.prediction === 'PCOS Positive' ? 'positive' : 'negative',
        confidence: mlResponse.data.confidence || mlResponse.data.pcos_risk_probability,
        probability: mlResponse.data.pcos_risk_probability,
        riskLevel: mlResponse.data.risk_level?.toLowerCase(),
        details: {
          timestamp: mlResponse.data.timestamp,
          input_summary: mlResponse.data.input_summary,
          follicle_count: mlResponse.data.follicle_count
        }
      },
      recommendations: mlResponse.data.recommendations || [],
      status: 'completed',
      processedAt: new Date()
    };

    const savedPrediction = await Prediction.create(predictionData);

    // Return prediction result with database ID
    res.json({
      success: true,
      data: mlResponse.data,
      predictionId: savedPrediction._id
    });

  } catch (error) {
    console.error('PCOS Prediction Error:', error.message);

    // Handle ML service errors
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'ML service error',
        error: error.response.data
      });
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Prediction service timeout. Please try again.'
      });
    }

    // Handle connection errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'ML service unavailable. Please contact support.'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Prediction failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/prediction/health
 * @desc    Check ML service health
 * @access  Private
 */
router.get('/health', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      ml_service: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML service unavailable',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/prediction/minimal-input
 * @desc    Get minimal input requirements
 * @access  Private
 */
router.get('/minimal-input', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/minimal-input`, {
      timeout: 5000
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Failed to fetch input requirements',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/prediction/history
 * @desc    Get user's prediction history
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const predictions = await Prediction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-inputData.imagePath');

    const total = await Prediction.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: predictions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction history',
      error: error.message
    });
  }
});

export default router;
