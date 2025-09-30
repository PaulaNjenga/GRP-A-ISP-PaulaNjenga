import Prediction from '../models/Prediction.js';

// Mock ML prediction function - replace with actual ML service call
const performMLPrediction = async (data, type) => {
  // Simulate ML processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock prediction logic based on some simple rules
  let prediction = 'negative';
  let confidence = 0.5;
  let riskLevel = 'low';

  if (type === 'tabular' || type === 'multimodal') {
    // Simple rule-based mock prediction
    const riskFactors = [];
    
    if (data.bmi && data.bmi > 25) riskFactors.push('High BMI');
    if (data.cycle && data.cycle === 'irregular') riskFactors.push('Irregular cycle');
    if (data.weightGain) riskFactors.push('Weight gain');
    if (data.hairGrowth) riskFactors.push('Excessive hair growth');
    if (data.pimples) riskFactors.push('Acne');
    
    const riskScore = riskFactors.length;
    
    if (riskScore >= 3) {
      prediction = 'positive';
      confidence = 0.7 + (riskScore * 0.05);
      riskLevel = 'high';
    } else if (riskScore >= 2) {
      prediction = 'uncertain';
      confidence = 0.6;
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
    probability: confidence,
    riskLevel,
    details: {
      message: `Based on the provided data, the prediction is ${prediction}`,
      factors: type === 'tabular' || type === 'multimodal' ? 
        ['BMI', 'Menstrual cycle regularity', 'Physical symptoms'] : 
        ['Image analysis'],
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

// @desc    Predict using tabular data
// @route   POST /api/predict/tabular
// @access  Private
export const predictTabular = async (req, res) => {
  try {
    const inputData = req.body;

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

    if (req.file) {
      inputData.imageUrl = `/uploads/${req.file.filename}`;
      inputData.imagePath = req.file.path;
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
