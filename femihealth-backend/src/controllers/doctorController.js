import User from '../models/User.js';
import Prediction from '../models/Prediction.js';

// @desc    Get doctor dashboard stats
// @route   GET /api/doctor/stats
// @access  Private/Doctor
export const getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Get all predictions reviewed by this doctor
    const reviewedPredictions = await Prediction.find({ reviewedBy: doctorId });
    
    // Get all completed predictions (for general stats)
    const allPredictions = await Prediction.find({ status: 'completed' });

    // Calculate stats - use all predictions for total, reviewed for diagnoses
    const totalDiagnoses = reviewedPredictions.length;
    
    // Get unique patients from all completed predictions (filter out null users)
    const uniquePatients = [...new Set(allPredictions.filter(p => p.user).map(p => p.user.toString()))];
    const totalPatients = uniquePatients.length;

    // Get predictions from this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonth = await Prediction.countDocuments({
      reviewedBy: doctorId,
      reviewedAt: { $gte: startOfMonth }
    });

    // Calculate average risk from all predictions
    const predictionsWithRisk = allPredictions.filter(p => p.result?.confidence);
    const averageRisk = predictionsWithRisk.length > 0
      ? predictionsWithRisk.reduce((sum, p) => sum + (p.result.confidence || 0), 0) / predictionsWithRisk.length
      : 0;

    // Risk distribution from all predictions
    const riskDistribution = {
      low: 0,
      moderate: 0,
      high: 0
    };

    allPredictions.forEach(prediction => {
      const confidence = prediction.result?.confidence || 0;
      if (confidence < 0.3) {
        riskDistribution.low++;
      } else if (confidence < 0.7) {
        riskDistribution.moderate++;
      } else {
        riskDistribution.high++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalDiagnoses,
        totalPatients,
        thisMonth,
        averageRisk,
        riskDistribution
      }
    });
  } catch (error) {
    console.error('Error in getDoctorStats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get doctor's patients
// @route   GET /api/doctor/patients
// @access  Private/Doctor
export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Get all completed predictions (not just reviewed ones)
    const predictions = await Prediction.find({ status: 'completed' })
      .populate('user', 'name email dateOfBirth')
      .sort({ createdAt: -1 });

    // Group by patient
    const patientMap = new Map();
    
    predictions.forEach(prediction => {
      // Skip predictions with null/undefined user
      if (!prediction.user || !prediction.user._id) {
        return;
      }
      
      const userId = prediction.user._id.toString();
      
      if (!patientMap.has(userId)) {
        // Calculate age group
        let ageGroup = 'Unknown';
        if (prediction.user.dateOfBirth) {
          const age = Math.floor((new Date() - new Date(prediction.user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 20) ageGroup = '<20';
          else if (age < 30) ageGroup = '20-29';
          else if (age < 40) ageGroup = '30-39';
          else if (age < 50) ageGroup = '40-49';
          else ageGroup = '50+';
        }

        patientMap.set(userId, {
          id: userId,
          anonymousId: `PAT-${userId.substring(0, 8).toUpperCase()}`,
          ageGroup,
          lastVisit: prediction.createdAt,
          totalVisits: 1,
          riskLevel: prediction.result?.confidence || 0,
          reviewed: !!prediction.reviewedBy
        });
      } else {
        const patient = patientMap.get(userId);
        patient.totalVisits++;
        // Update last visit if this is more recent
        if (new Date(prediction.reviewedAt || prediction.createdAt) > new Date(patient.lastVisit)) {
          patient.lastVisit = prediction.reviewedAt || prediction.createdAt;
          patient.riskLevel = prediction.result?.confidence || 0;
        }
      }
    });

    const patients = Array.from(patientMap.values());

    res.json({
      success: true,
      patients
    });
  } catch (error) {
    console.error('Error in getDoctorPatients:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get doctor's recent diagnoses
// @route   GET /api/doctor/diagnoses
// @access  Private/Doctor
export const getDoctorDiagnoses = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get all completed predictions (show both reviewed and pending)
    const diagnoses = await Prediction.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name');

    // Format diagnoses for frontend (filter out null users)
    const formattedDiagnoses = diagnoses
      .filter(d => d.user && d.user._id)
      .map(d => ({
        id: d._id,
        patient: {
          anonymousId: `PAT-${d.user._id.toString().substring(0, 8).toUpperCase()}`,
          name: d.user.name
        },
      diagnosis: d.reviewNotes || (d.reviewedBy ? 'Reviewed' : 'Pending review'),
      risk: d.result?.confidence || 0,
      confidence: d.result?.confidence || 0,
      prediction: d.result?.prediction || 'uncertain',
      createdAt: d.createdAt,
      reviewedAt: d.reviewedAt,
      reviewedBy: d.reviewedBy?.name,
      isReviewed: !!d.reviewedBy
    }));

    const total = await Prediction.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      diagnoses: formattedDiagnoses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getDoctorDiagnoses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get all predictions for doctor review
// @route   GET /api/doctor/predictions
// @access  Private/Doctor
export const getPredictionsForReview = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get predictions that need review (completed but not reviewed)
    const predictions = await Prediction.find({ 
      status: 'completed',
      reviewedBy: { $exists: false }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('user', 'name email');

    const total = await Prediction.countDocuments({ 
      status: 'completed',
      reviewedBy: { $exists: false }
    });

    res.json({
      success: true,
      predictions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getPredictionsForReview:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Review a prediction
// @route   PUT /api/doctor/predictions/:id/review
// @access  Private/Doctor
export const reviewPrediction = async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    const predictionId = req.params.id;
    const doctorId = req.user._id;

    const prediction = await Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({ 
        success: false,
        message: 'Prediction not found' 
      });
    }

    prediction.reviewedBy = doctorId;
    prediction.reviewNotes = reviewNotes;
    prediction.reviewedAt = new Date();

    await prediction.save();

    res.json({
      success: true,
      message: 'Prediction reviewed successfully',
      prediction
    });
  } catch (error) {
    console.error('Error in reviewPrediction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};
