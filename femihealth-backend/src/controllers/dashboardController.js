import User from '../models/User.js';
import Prediction from '../models/Prediction.js';

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '6months' } = req.query;

    const rangeInMonths = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12,
    }[timeRange] || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - rangeInMonths);

    const [recentPredictions, totalPredictions, positivePredictions, negativePredictions, latestPrediction] = await Promise.all([
      Prediction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5),
      Prediction.countDocuments({ user: userId }),
      Prediction.countDocuments({ user: userId, 'result.prediction': 'positive' }),
      Prediction.countDocuments({ user: userId, 'result.prediction': 'negative' }),
      Prediction.findOne({ user: userId }).sort({ createdAt: -1 }),
    ]);

    const timeframePredictions = await Prediction.find({
      user: userId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    const allPredictions = timeframePredictions.length > 0 ? timeframePredictions : recentPredictions.slice().reverse();

    const riskLevelToValue = (riskLevel) => {
      switch (riskLevel) {
        case 'low':
          return 0.2;
        case 'medium':
        case 'moderate':
          return 0.5;
        case 'high':
          return 0.8;
        default:
          return 0.0;
      }
    };

    const getRiskValue = (prediction) => {
      if (!prediction || !prediction.result) {
        return 0;
      }

      if (typeof prediction.result.probability === 'number') {
        return Math.min(Math.max(prediction.result.probability, 0), 1);
      }

      if (typeof prediction.result.confidence === 'number') {
        return Math.min(Math.max(prediction.result.confidence, 0), 1);
      }

      if (prediction.result.riskLevel) {
        return riskLevelToValue(prediction.result.riskLevel);
      }

      if (prediction.result.prediction) {
        if (prediction.result.prediction === 'positive') return 0.75;
        if (prediction.result.prediction === 'negative') return 0.25;
        return 0.5;
      }

      return 0;
    };

    const riskTrend = allPredictions.map((prediction) => ({
      date: prediction.createdAt,
      risk: getRiskValue(prediction),
    }));

    let trendDirection = 'steady';
    let trendChange = 0;
    if (riskTrend.length >= 2) {
      const firstRisk = riskTrend[0].risk;
      const lastRisk = riskTrend[riskTrend.length - 1].risk;
      trendChange = (lastRisk - firstRisk) * 100;
      if (trendChange > 1) trendDirection = 'up';
      else if (trendChange < -1) trendDirection = 'down';
    }

    const daysSinceLastAssessment = latestPrediction
      ? Math.floor((Date.now() - latestPrediction.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const latestRisk = getRiskValue(latestPrediction);

    const riskDistribution = { low: 0, moderate: 0, high: 0 };
    const distributionPredictions = timeframePredictions.length > 0 ? timeframePredictions : await Prediction.find({ user: userId });
    distributionPredictions.forEach((prediction) => {
      const risk = getRiskValue(prediction);
      if (risk < 0.33) riskDistribution.low += 1;
      else if (risk < 0.66) riskDistribution.moderate += 1;
      else riskDistribution.high += 1;
    });

    const symptomFields = [
      { key: 'weightGain', label: 'Weight Gain' },
      { key: 'hairGrowth', label: 'Excess Hair Growth' },
      { key: 'skinDarkening', label: 'Skin Darkening' },
      { key: 'hairLoss', label: 'Hair Loss' },
      { key: 'pimples', label: 'Acne & Pimples' },
      { key: 'fastFood', label: 'Frequent Fast Food' },
      { key: 'exercise', label: 'Lack of Exercise' },
    ];

    const symptomFrequencyMap = new Map();
    (distributionPredictions.length > 0 ? distributionPredictions : recentPredictions).forEach((prediction) => {
      symptomFields.forEach(({ key, label }) => {
        const value = prediction.inputData?.[key];
        if (typeof value === 'boolean' && value) {
          symptomFrequencyMap.set(label, (symptomFrequencyMap.get(label) || 0) + 1);
        }
      });
    });

    const symptomFrequency = Array.from(symptomFrequencyMap.entries())
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count);

    const recentAssessments = recentPredictions.map((prediction) => ({
      id: prediction._id,
      risk: getRiskValue(prediction),
      riskLevel: prediction.result?.riskLevel || null,
      prediction: prediction.result?.prediction || null,
      confidence: prediction.result?.confidence ?? null,
      date: prediction.createdAt,
      hasImage: Boolean(prediction.inputData?.imageUrl || prediction.inputData?.imagePath),
    }));

    const insights = [];
    const timeframePositiveCount = allPredictions.filter((p) => p.result?.prediction === 'positive').length;
    if (allPredictions.length > 0 && timeframePositiveCount > allPredictions.length / 2) {
      insights.push({
        type: 'warning',
        title: 'Consistent Risk Indicators',
        description: 'Your recent predictions show elevated PCOS risk levels. Consider consulting a healthcare provider.',
      });
    }

    const lifestyleFlags = allPredictions.some((p) => p.inputData?.fastFood || p.inputData?.exercise === false);
    if (lifestyleFlags) {
      insights.push({
        type: 'info',
        title: 'Lifestyle Adjustment Opportunity',
        description: 'Reducing fast food intake and increasing regular exercise may improve your assessment outcomes.',
      });
    }

    insights.push({
      type: 'success',
      title: 'Keep Tracking',
      description: 'Regular assessments help build better trend insights. Continue monitoring consistently.',
    });

    res.json({
      success: true,
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        stats: {
          totalAssessments: totalPredictions,
          latestRisk,
          trendDirection,
          trendChange,
          daysSinceLastAssessment,
        },
        riskTrend,
        riskDistribution,
        symptomFrequency,
        recentAssessments,
        insights,
        // Legacy fields kept for backwards compatibility
        statistics: {
          totalPredictions,
          positivePredictions,
          negativePredictions,
          uncertainPredictions: totalPredictions - positivePredictions - negativePredictions,
        },
        recentPredictions,
        latestPrediction,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/dashboard/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parse name into firstName and lastName if needed
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Convert address to string (handle object, string, or empty)
    let addressString = '';
    if (user.address) {
      if (typeof user.address === 'object') {
        const parts = [
          user.address.street,
          user.address.city,
          user.address.state,
          user.address.zipCode,
          user.address.country
        ].filter(Boolean);
        addressString = parts.join(', ');
      } else if (typeof user.address === 'string') {
        addressString = user.address;
      }
    }

    // Format dateOfBirth as string
    const dateOfBirthString = user.dateOfBirth 
      ? new Date(user.dateOfBirth).toISOString().split('T')[0] 
      : '';

    // Format the user data to match frontend expectations
    const profileData = {
      _id: user._id,
      firstName,
      lastName,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      dateOfBirth: dateOfBirthString,
      gender: user.gender || '',
      address: addressString,
      height: user.height || '',
      weight: user.weight || '',
      medicalHistory: user.medicalHistory?.conditions || [],
      medications: user.medicalHistory?.medications || [],
      allergies: user.medicalHistory?.allergies || [],
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        phone: user.emergencyContact?.phone || '',
        relationship: user.emergencyContact?.relationship || ''
      },
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/dashboard/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'name',
      'phone',
      'dateOfBirth',
      'gender',
      'address',
      'height',
      'weight',
      'medicalHistory',
      'emergencyContact',
    ];

    const updates = {};
    
    // Handle firstName and lastName conversion to name
    if (req.body.firstName || req.body.lastName) {
      const firstName = req.body.firstName || '';
      const lastName = req.body.lastName || '';
      updates.name = `${firstName} ${lastName}`.trim();
    }
    
    // Handle medical history fields (frontend sends as separate arrays)
    if (req.body.medicalHistory || req.body.medications || req.body.allergies) {
      updates.medicalHistory = {
        conditions: req.body.medicalHistory || [],
        medications: req.body.medications || [],
        allergies: req.body.allergies || [],
      };
    }
    
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key) && 
          key !== 'medicalHistory' && 
          key !== 'medications' && 
          key !== 'allergies') {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert address to string (handle object, string, or empty)
    let addressString = '';
    if (user.address) {
      if (typeof user.address === 'object') {
        const parts = [
          user.address.street,
          user.address.city,
          user.address.state,
          user.address.zipCode,
          user.address.country
        ].filter(Boolean);
        addressString = parts.join(', ');
      } else if (typeof user.address === 'string') {
        addressString = user.address;
      }
    }

    // Format dateOfBirth as ISO string
    const dateOfBirthString = user.dateOfBirth 
      ? new Date(user.dateOfBirth).toISOString().split('T')[0] 
      : '';

    // Ensure emergencyContact has string fields
    const emergencyContact = {
      name: user.emergencyContact?.name || '',
      phone: user.emergencyContact?.phone || '',
      relationship: user.emergencyContact?.relationship || ''
    };

    // Format the user data to match frontend expectations
    const profileData = {
      _id: user._id,
      firstName,
      lastName,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      dateOfBirth: dateOfBirthString,
      gender: user.gender || '',
      address: addressString,
      height: user.height || '',
      weight: user.weight || '',
      medicalHistory: user.medicalHistory?.conditions || [],
      medications: user.medicalHistory?.medications || [],
      allergies: user.medicalHistory?.allergies || [],
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        phone: user.emergencyContact?.phone || '',
        relationship: user.emergencyContact?.relationship || ''
      },
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get prediction statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get monthly statistics
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Prediction.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          positive: {
            $sum: {
              $cond: [{ $eq: ['$result.prediction', 'positive'] }, 1, 0],
            },
          },
          negative: {
            $sum: {
              $cond: [{ $eq: ['$result.prediction', 'negative'] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    res.json({
      success: true,
      stats: monthlyStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get health insights
// @route   GET /api/dashboard/insights
// @access  Private
export const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent predictions for analysis
    const recentPredictions = await Prediction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const insights = [];

    if (recentPredictions.length > 0) {
      const positiveCount = recentPredictions.filter(
        (p) => p.result.prediction === 'positive'
      ).length;

      if (positiveCount > recentPredictions.length / 2) {
        insights.push({
          type: 'warning',
          title: 'Consistent Risk Indicators',
          message: 'Your recent predictions show consistent risk indicators. Consider consulting with a healthcare provider.',
          priority: 'high',
        });
      }

      // Check for lifestyle factors
      const hasLifestyleIssues = recentPredictions.some(
        (p) => p.inputData.fastFood || !p.inputData.exercise
      );

      if (hasLifestyleIssues) {
        insights.push({
          type: 'info',
          title: 'Lifestyle Improvement Opportunity',
          message: 'Your data suggests potential for lifestyle improvements. Regular exercise and healthy diet can make a significant difference.',
          priority: 'medium',
        });
      }
    }

    // Add general insights
    insights.push({
      type: 'success',
      title: 'Regular Monitoring',
      message: 'Keep tracking your health regularly for better insights and early detection.',
      priority: 'low',
    });

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
