const express = require('express');
const { User, Prediction, USER_ROLES, AnonymizationUtils } = require('../models/UserMongoDB');
const { RBACMiddleware, requireManageUsers, requireViewSystemHealth } = require('../middleware/rbac');

const router = express.Router();

// Middleware to ensure user is admin
router.use(RBACMiddleware.requireAdmin());

// Get system health and analytics
router.get('/system/health', requireViewSystemHealth(), async (req, res) => {
  try {
    const systemHealth = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Get system metrics using MongoDB aggregation
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalPredictions = await Prediction.countDocuments();
    
    // User role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleStats = {
      patients: roleDistribution.find(r => r._id === USER_ROLES.PATIENT)?.count || 0,
      doctors: roleDistribution.find(r => r._id === USER_ROLES.DOCTOR)?.count || 0,
      admins: roleDistribution.find(r => r._id === USER_ROLES.ADMIN)?.count || 0
    };

    // Risk distribution from predictions
    const riskDistribution = await Prediction.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const riskStats = {
      low: riskDistribution.find(r => r._id === 'low')?.count || 0,
      moderate: riskDistribution.find(r => r._id === 'moderate')?.count || 0,
      high: riskDistribution.find(r => r._id === 'high')?.count || 0
    };

    res.json({
      success: true,
      data: {
        systemHealth,
        metrics: {
          totalUsers,
          activeUsers,
          totalPredictions,
          riskDistribution: riskStats,
          roleDistribution: roleStats
        },
        anonymizedStats: {
          userCount: totalUsers,
          predictionCount: totalPredictions
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health',
      error: error.message
    });
  }
});

// Get anonymized analytics data
router.get('/analytics', requireViewSystemHealth(), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Get anonymized data for analytics using MongoDB aggregation
    const anonymizedUsers = await User.getAnonymizedStats();
    const anonymizedPredictions = await Prediction.getAnonymizedStats();

    // Calculate time-based metrics
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    // Filter predictions by time range
    const filteredPredictions = anonymizedPredictions.filter(p => 
      new Date(p.createdMonth + '-01') >= startDate
    );

    // Age group analysis
    const ageGroupAnalysis = {};
    anonymizedUsers.forEach(user => {
      const ageGroup = user.ageGroup || 'unknown';
      ageGroupAnalysis[ageGroup] = (ageGroupAnalysis[ageGroup] || 0) + 1;
    });

    // Risk trend analysis
    const riskTrends = {};
    filteredPredictions.forEach(prediction => {
      const month = prediction.createdMonth;
      if (!riskTrends[month]) {
        riskTrends[month] = { total: 0, lowRisk: 0, moderateRisk: 0, highRisk: 0 };
      }
      riskTrends[month].total++;
      if (prediction.risk < 0.3) riskTrends[month].lowRisk++;
      else if (prediction.risk < 0.7) riskTrends[month].moderateRisk++;
      else riskTrends[month].highRisk++;
    });

    // Doctor involvement analysis
    const doctorInvolvement = {
      selfAssessments: filteredPredictions.filter(p => !p.doctorInvolved).length,
      doctorDiagnoses: filteredPredictions.filter(p => p.doctorInvolved).length
    };

    res.json({
      success: true,
      data: {
        timeRange,
        totalUsers: anonymizedUsers.length,
        totalPredictions: filteredPredictions.length,
        ageGroupAnalysis,
        riskTrends,
        doctorInvolvement,
        averageRisk: filteredPredictions.length > 0 
          ? filteredPredictions.reduce((sum, p) => sum + p.risk, 0) / filteredPredictions.length 
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
});

// Manage user roles and verification
router.put('/users/:userId/role', requireManageUsers(), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, verificationStatus } = req.body;

    const user = User.findById(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role
    if (role && !Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Prevent admin from changing their own role
    if (parseInt(userId) === req.user.id && role && role !== USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    // Update user
    const updateData = {};
    if (role) updateData.role = role;
    if (verificationStatus) updateData.verificationStatus = verificationStatus;

    user.update(updateData);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user.toSafeJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// Get doctor verification requests
router.get('/doctors/verification-requests', requireManageUsers(), async (req, res) => {
  try {
    const doctors = User.getAll({ role: USER_ROLES.DOCTOR });
    const pendingVerifications = doctors.filter(d => d.verificationStatus === 'pending');

    const verificationRequests = pendingVerifications.map(doctor => ({
      id: doctor.id,
      name: `${doctor.firstName} ${doctor.lastName}`,
      email: AnonymizationUtils.anonymizeEmail(doctor.email),
      licenseNumber: doctor.licenseNumber,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      createdAt: doctor.createdAt,
      verificationStatus: doctor.verificationStatus
    }));

    res.json({
      success: true,
      data: {
        requests: verificationRequests,
        total: verificationRequests.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification requests',
      error: error.message
    });
  }
});

// Approve/reject doctor verification
router.post('/doctors/:doctorId/verify', requireManageUsers(), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'

    const doctor = User.findById(parseInt(doctorId));
    if (!doctor || !doctor.isDoctor()) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const verificationStatus = action === 'approve' ? 'verified' : 'rejected';
    doctor.update({ 
      verificationStatus,
      verificationNotes: notes,
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Doctor ${action}d successfully`,
      data: {
        doctorId: doctor.id,
        verificationStatus: doctor.verificationStatus,
        verifiedAt: doctor.verifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process verification',
      error: error.message
    });
  }
});

// Export anonymized data for research/compliance
router.get('/export/anonymized-data', requireViewSystemHealth(), async (req, res) => {
  try {
    const { format = 'json', includeUsers = true, includePredictions = true } = req.query;

    const exportData = {};

    if (includeUsers === 'true') {
      exportData.users = User.getAnonymizedStats();
    }

    if (includePredictions === 'true') {
      exportData.predictions = Prediction.getAnonymizedStats();
    }

    exportData.exportMetadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.anonymousId,
      format,
      totalRecords: (exportData.users?.length || 0) + (exportData.predictions?.length || 0)
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      let csvContent = '';
      
      if (exportData.users) {
        csvContent += 'Users Data\n';
        csvContent += Object.keys(exportData.users[0] || {}).join(',') + '\n';
        exportData.users.forEach(user => {
          csvContent += Object.values(user).join(',') + '\n';
        });
        csvContent += '\n';
      }

      if (exportData.predictions) {
        csvContent += 'Predictions Data\n';
        csvContent += Object.keys(exportData.predictions[0] || {}).join(',') + '\n';
        exportData.predictions.forEach(prediction => {
          csvContent += Object.values(prediction).join(',') + '\n';
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=femihealth-anonymized-data.csv');
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

module.exports = router;
