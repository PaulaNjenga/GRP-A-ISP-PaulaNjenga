import User from '../models/User.js';
import Prediction from '../models/Prediction.js';

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent predictions
    const recentPredictions = await Prediction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-inputData.imagePath');

    // Get statistics
    const totalPredictions = await Prediction.countDocuments({ user: userId });
    const positivePredictions = await Prediction.countDocuments({
      user: userId,
      'result.prediction': 'positive',
    });
    const negativePredictions = await Prediction.countDocuments({
      user: userId,
      'result.prediction': 'negative',
    });

    // Get latest prediction
    const latestPrediction = await Prediction.findOne({ user: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
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

    res.json({
      success: true,
      user,
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
      'medicalHistory',
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user,
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
