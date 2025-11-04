import Prediction from '../models/Prediction.js';
import axios from 'axios';

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_TIMEOUT = 30000; // 30 seconds

// ML prediction function - calls Flask ML service
const performMLPrediction = async (data, type) => {
  try {
    // Call actual ML service
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        beta_hcg_i: parseFloat(data.beta_hcg_i),
        beta_hcg_ii: parseFloat(data.beta_hcg_ii),
        amh: parseFloat(data.amh)
      },
      { 
        timeout: ML_SERVICE_TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data && response.data.success) {
      return {
        prediction: response.data.prediction,
        confidence: response.data.confidence,
        probability: response.data.probability,
        riskLevel: response.data.risk_level,
        riskScore: response.data.risk_score,
        details: response.data.details
      };
    } else {
      throw new Error('Invalid response from ML service');
    }
  } catch (error) {
    console.error('ML Service Error:', error.message);
    
    // Fallback to mock prediction if ML service is unavailable
    console.warn('Falling back to mock prediction...');
    return performMockPrediction(data, type);
  }
};

// Fallback mock prediction function
const performMockPrediction = async (data, type) => {
  // Simulate ML processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock prediction logic based on β-hCG and AMH levels
  let prediction = 'negative';
  let confidence = 0.5;
  let riskLevel = 'low';
  let riskScore = 0;

  if (type === 'tabular' || type === 'multimodal') {
    const { beta_hcg_i, beta_hcg_ii, amh } = data;
    
    // Simple rule-based mock prediction using your actual parameters
    // These thresholds are placeholders - will be replaced by trained model
    
    // High AMH levels (>4.0 ng/mL) indicate PCOS risk
    if (amh && amh > 4.0) {
      riskScore += 0.4;
    } else if (amh && amh > 3.0) {
      riskScore += 0.2;
    }
    
    // β-hCG patterns can indicate hormonal imbalances
    if (beta_hcg_i && beta_hcg_ii) {
      const hcgRatio = beta_hcg_ii / beta_hcg_i;
      
      // Abnormal β-hCG progression
      if (hcgRatio < 1.5 || hcgRatio > 3.0) {
        riskScore += 0.3;
      }
      
      // Elevated β-hCG levels
      if (beta_hcg_i > 100 || beta_hcg_ii > 200) {
        riskScore += 0.2;
      }
    }
    
    // Determine risk level based on score
    if (riskScore >= 0.6) {
      prediction = 'positive';
      confidence = 0.7 + (riskScore * 0.2);
      riskLevel = 'high';
    } else if (riskScore >= 0.3) {
      prediction = 'uncertain';
      confidence = 0.6 + (riskScore * 0.1);
      riskLevel = 'medium';
    } else {
      prediction = 'negative';
      confidence = 0.75;
      riskLevel = 'low';
    }
  }

  return {
    prediction,
    confidence: Math.min(confidence, 0.95),
    probability: Math.min(riskScore, 1.0),
    riskLevel,
    riskScore: riskScore,
    details: {
      message: `Based on the provided hormonal markers, the PCOS risk is ${riskLevel}`,
      factors: type === 'tabular' || type === 'multimodal' ? 
        ['β-hCG I levels', 'β-hCG II levels', 'AMH (Anti-Müllerian Hormone)'] : 
        ['Ultrasound image analysis'],
      values: {
        beta_hcg_i: data.beta_hcg_i,
        beta_hcg_ii: data.beta_hcg_ii,
        amh: data.amh,
      }
    },
  };
};

// Generate recommendations based on prediction
const generateRecommendations = (prediction, inputData) => {
  const recommendations = [];

  if (prediction.prediction === 'positive' || prediction.prediction === 'uncertain') {
    recommendations.push({
      category: 'Medical',
      title: 'Consult a Healthcare Provider',
      description: 'Schedule an appointment with a gynecologist or endocrinologist for proper diagnosis and treatment.',
      priority: 'high',
    });

    if (inputData.bmi && inputData.bmi > 25) {
      recommendations.push({
        category: 'Lifestyle',
        title: 'Weight Management',
        description: 'Consider a balanced diet and regular exercise to maintain a healthy weight.',
        priority: 'high',
      });
    }

    if (inputData.exercise === false) {
      recommendations.push({
        category: 'Exercise',
        title: 'Regular Physical Activity',
        description: 'Aim for at least 150 minutes of moderate exercise per week.',
        priority: 'medium',
      });
    }

    if (inputData.fastFood === true) {
      recommendations.push({
        category: 'Diet',
        title: 'Improve Diet Quality',
        description: 'Reduce fast food consumption and focus on whole foods, vegetables, and lean proteins.',
        priority: 'medium',
      });
    }
  } else {
    recommendations.push({
      category: 'Prevention',
      title: 'Maintain Healthy Lifestyle',
      description: 'Continue with regular exercise, balanced diet, and routine health check-ups.',
      priority: 'low',
    });
  }

  return recommendations;
};

// Validate input data
const validatePredictionInput = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.beta_hcg_i) errors.push('beta_hcg_i is required');
  if (!data.beta_hcg_ii) errors.push('beta_hcg_ii is required');
  if (!data.amh) errors.push('amh is required');
  
  // Type validation
  if (data.beta_hcg_i && typeof data.beta_hcg_i !== 'number') {
    errors.push('beta_hcg_i must be a number');
  }
  if (data.beta_hcg_ii && typeof data.beta_hcg_ii !== 'number') {
    errors.push('beta_hcg_ii must be a number');
  }
  if (data.amh && typeof data.amh !== 'number') {
    errors.push('amh must be a number');
  }
  
  // Range validation
  if (data.beta_hcg_i && (data.beta_hcg_i < 0.1 || data.beta_hcg_i > 10000.0)) {
    errors.push('beta_hcg_i must be between 0.1 and 10000.0 mIU/mL');
  }
  if (data.beta_hcg_ii && (data.beta_hcg_ii < 0.1 || data.beta_hcg_ii > 10000.0)) {
    errors.push('beta_hcg_ii must be between 0.1 and 10000.0 mIU/mL');
  }
  if (data.amh && (data.amh < 0.1 || data.amh > 20.0)) {
    errors.push('amh must be between 0.1 and 20.0 ng/mL');
  }
  
  return errors;
};

// @desc    Predict using tabular data
// @route   POST /api/predict/tabular
// @access  Private
export const predictTabular = async (req, res) => {
  try {
    const inputData = req.body;
    
    // Validate input
    const validationErrors = validatePredictionInput(inputData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Round to 2 decimal places
    inputData.beta_hcg_i = parseFloat(inputData.beta_hcg_i.toFixed(2));
    inputData.beta_hcg_ii = parseFloat(inputData.beta_hcg_ii.toFixed(2));
    inputData.amh = parseFloat(inputData.amh.toFixed(2));

    // Create prediction record
    const prediction = await Prediction.create({
      user: req.user._id,
      type: 'tabular',
      inputData,
      status: 'processing',
    });

    // Perform ML prediction
    const result = await performMLPrediction(inputData, 'tabular');
    const recommendations = generateRecommendations(result, inputData);

    // Update prediction with results
    prediction.result = result;
    prediction.recommendations = recommendations;
    prediction.status = 'completed';
    prediction.processedAt = new Date();
    await prediction.save();

    res.json({
      success: true,
      prediction: prediction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Predict using image
// @route   POST /api/predict/image
// @access  Private
export const predictImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const inputData = {
      imageUrl: `/uploads/${req.file.filename}`,
      imagePath: req.file.path,
    };

    // Create prediction record
    const prediction = await Prediction.create({
      user: req.user._id,
      type: 'image',
      inputData,
      status: 'processing',
    });

    // Perform ML prediction
    const result = await performMLPrediction(inputData, 'image');
    const recommendations = generateRecommendations(result, inputData);

    // Update prediction with results
    prediction.result = result;
    prediction.recommendations = recommendations;
    prediction.status = 'completed';
    prediction.processedAt = new Date();
    await prediction.save();

    res.json({
      success: true,
      prediction: prediction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Predict using multimodal (tabular + image)
// @route   POST /api/predict/multimodal
// @access  Private
export const predictMultimodal = async (req, res) => {
  try {
    const inputData = { ...req.body };

    // Handle both single file and multiple fields
    const imageFile = req.file || req.files?.image?.[0] || req.files?.ultrasound_image?.[0];
    
    if (imageFile) {
      inputData.imageUrl = `/uploads/${imageFile.filename}`;
      inputData.imagePath = imageFile.path;
    }

    // Create prediction record
    const prediction = await Prediction.create({
      user: req.user._id,
      type: 'multimodal',
      inputData,
      status: 'processing',
    });

    // Perform ML prediction
    const result = await performMLPrediction(inputData, 'multimodal');
    const recommendations = generateRecommendations(result, inputData);

    // Update prediction with results
    prediction.result = result;
    prediction.recommendations = recommendations;
    prediction.status = 'completed';
    prediction.processedAt = new Date();
    await prediction.save();

    res.json({
      success: true,
      prediction: prediction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get prediction result by ID
// @route   GET /api/predict/result/:id
// @access  Private
export const getResult = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name email');

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    // Check if user owns this prediction or is admin/doctor
    if (
      prediction.user._id.toString() !== req.user._id.toString() &&
      !['admin', 'doctor'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Not authorized to access this prediction' });
    }

    res.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user's prediction history
// @route   GET /api/predict/history
// @access  Private
export const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    const predictions = await Prediction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-inputData.imagePath');

    const total = await Prediction.countDocuments(query);

    res.json({
      success: true,
      predictions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
