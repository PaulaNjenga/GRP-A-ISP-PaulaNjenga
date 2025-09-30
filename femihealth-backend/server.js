const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const connectDB = require('./config/database');
const { User, Prediction, USER_ROLES, PERMISSIONS } = require('./models/UserMongoDB');
const mlModel = require('./utils/mlModel');
const {
  authenticateToken,
  requireAdmin,
  handleValidationErrors,
  authValidation,
  predictionValidation,
  profileValidation
} = require('./middleware/auth');
const { 
  RBACMiddleware, 
  requireSelfPredict, 
  requireDiagnose, 
  requireViewPatientData, 
  requireManageUsers, 
  requireViewSystemHealth 
} = require('./middleware/rbac');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Import route modules
const doctorRoutes = require('./routes/doctor');
const adminRoutes = require('./routes/admin');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads', 'medical');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'FemiHealth Backend API'
  });
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Enhanced authentication middleware that adds user object to request
const enhancedAuthMiddleware = async (req, res, next) => {
  try {
    await authenticateToken(req, res, async () => {
      // Add full user object to request for RBAC
      const user = await User.findById(req.user.userId);
      if (user) {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Mount route modules
app.use('/api/doctor', enhancedAuthMiddleware, doctorRoutes);
app.use('/api/admin', enhancedAuthMiddleware, adminRoutes);
// Auth routes
app.post('/api/auth/login', authValidation.login, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

app.post('/api/auth/register', authValidation.register, handleValidationErrors, async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, height, weight } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      dateOfBirth: new Date(dateOfBirth),
      height,
      weight,
      role: USER_ROLES.PATIENT // Default role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

app.post('/api/auth/logout', enhancedAuthMiddleware, (req, res) => {
  // In production, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/auth/verify', enhancedAuthMiddleware, async (req, res) => {
  try {
    // User is already loaded by enhancedAuthMiddleware
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          role: req.user.role,
          permissions: req.user.permissions
        }
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

app.post('/api/auth/change-password', enhancedAuthMiddleware, authValidation.changePassword, handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
});

app.post('/api/auth/mfa/setup', enhancedAuthMiddleware, async (req, res) => {
  try {
    // Mock MFA setup - implement with actual TOTP library in production
    const mockSecret = 'JBSWY3DPEHPK3PXP';
    const qrCodeUrl = `otpauth://totp/FemiHealth:${req.user.email}?secret=${mockSecret}&issuer=FemiHealth`;
    
    // Store MFA secret
    req.user.mfaSecret = mockSecret;
    await req.user.save();
    
    res.json({
      success: true,
      data: {
        secret: mockSecret,
        qrCodeUrl: qrCodeUrl
      }
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'MFA setup failed'
    });
  }
});

app.post('/api/auth/mfa/verify', enhancedAuthMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    
    // Mock MFA verification - implement with actual TOTP verification in production
    if (token && token.length === 6) {
      req.user.mfaEnabled = true;
      await req.user.save();
      
      res.json({
        success: true,
        message: 'MFA enabled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid MFA token'
      });
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'MFA verification failed'
    });
  }
});
// Prediction routes
app.post('/api/predict/tabular', enhancedAuthMiddleware, requireSelfPredict(), RBACMiddleware.auditLog('tabular_prediction'), predictionValidation.tabular, handleValidationErrors, async (req, res) => {
  try {
    const inputData = req.body;
    const userId = req.user._id;

    // Calculate risk using ML model
    const { risk, confidence } = mlModel.calculateTabularRisk(inputData);
    const riskFactors = mlModel.identifyRiskFactors(inputData, risk);
    const recommendations = mlModel.generateRecommendations(inputData, risk);
    const riskLevel = mlModel.getRiskLevel(risk);

    // Create prediction record
    const prediction = new Prediction({
      userId,
      anonymousUserId: req.user.anonymousId,
      type: 'tabular',
      purpose: 'self_assessment',
      inputData,
      risk,
      confidence,
      riskLevel,
      riskFactors,
      recommendations,
      status: 'completed'
    });

    await prediction.save();

    res.json({
      success: true,
      data: {
        prediction: {
          id: prediction._id,
          type: prediction.type,
          risk: prediction.risk,
          confidence: prediction.confidence,
          riskLevel: prediction.riskLevel,
          createdAt: prediction.createdAt
        },
        risk,
        confidence,
        riskLevel,
        riskFactors,
        recommendations
      }
    });
  } catch (error) {
    console.error('Tabular prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed'
    });
  }
});

app.post('/api/predict/image', enhancedAuthMiddleware, requireSelfPredict(), RBACMiddleware.auditLog('image_prediction'), upload.single('ultrasound_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Ultrasound image is required'
      });
    }

    const userId = req.user.userId;
    const imageBuffer = req.file.buffer;

    // Analyze image using ML model
    const { risk, confidence, analysis } = mlModel.analyzeImage(imageBuffer);
    const riskLevel = mlModel.getRiskLevel(risk);

    // Save prediction
    const prediction = Prediction.create({
      userId,
      type: 'image',
      inputData: { imageSize: req.file.size, imageType: req.file.mimetype },
      risk,
      confidence,
      factors: ['Ultrasound Analysis'],
      recommendations: mlModel.generateRecommendations({}, risk),
      imageAnalysis: analysis
    });

    res.json({
      success: true,
      data: {
        id: prediction.id,
        risk,
        confidence,
        riskLevel,
        imageAnalysis: analysis,
        recommendations: prediction.recommendations,
        createdAt: prediction.createdAt
      }
    });
  } catch (error) {
    console.error('Image prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Image prediction failed'
    });
  }
});

app.post('/api/predict/multimodal', enhancedAuthMiddleware, requireSelfPredict(), RBACMiddleware.auditLog('multimodal_prediction'), upload.single('ultrasound_image'), predictionValidation.tabular, handleValidationErrors, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Ultrasound image is required for multimodal prediction'
      });
    }

    const inputData = req.body;
    const userId = req.user.userId;
    const imageBuffer = req.file.buffer;

    // Perform multimodal prediction
    const result = mlModel.predictMultimodal(inputData, imageBuffer);
    const riskFactors = mlModel.identifyRiskFactors(inputData, result.risk);
    const recommendations = mlModel.generateRecommendations(inputData, result.risk);
    const riskLevel = mlModel.getRiskLevel(result.risk);

    // Save prediction
    const prediction = Prediction.create({
      userId,
      type: 'multimodal',
      inputData: { ...inputData, imageSize: req.file.size, imageType: req.file.mimetype },
      risk: result.risk,
      confidence: result.confidence,
      factors: riskFactors,
      recommendations,
      imageAnalysis: result.imageAnalysis
    });

    res.json({
      success: true,
      data: {
        id: prediction.id,
        risk: result.risk,
        confidence: result.confidence,
        riskLevel,
        tabularRisk: result.tabularRisk,
        imageRisk: result.imageRisk,
        factors: riskFactors,
        recommendations,
        imageAnalysis: result.imageAnalysis,
        createdAt: prediction.createdAt
      }
    });
  } catch (error) {
    console.error('Multimodal prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Multimodal prediction failed'
    });
  }
});

app.get('/api/predict/result/:id', enhancedAuthMiddleware, RBACMiddleware.requireResourceAccess(PERMISSIONS.VIEW_PATIENT_DATA, 'id'), async (req, res) => {
  try {
    const predictionId = parseInt(req.params.id);
    const prediction = Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Check if user owns this prediction or is admin
    if (prediction.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const riskLevel = mlModel.getRiskLevel(prediction.risk);

    res.json({
      success: true,
      data: {
        ...prediction,
        riskLevel
      }
    });
  } catch (error) {
    console.error('Get prediction result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction result'
    });
  }
});

app.get('/api/predict/history', enhancedAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const predictions = await Prediction
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('type risk confidence riskLevel createdAt status');

    const total = await Prediction.countDocuments({ userId });

    const predictionsWithRiskLevel = predictions.map(prediction => ({
      id: prediction._id,
      type: prediction.type,
      risk: prediction.risk,
      confidence: prediction.confidence,
      riskLevel: prediction.riskLevel || mlModel.getRiskLevel(prediction.risk),
      createdAt: prediction.createdAt,
      status: prediction.status
    }));

    res.json({
      success: true,
      data: {
        predictions: predictionsWithRiskLevel,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get prediction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction history'
    });
  }
});

// Dashboard routes
app.get('/api/dashboard', enhancedAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = User.findById(userId);
    const allUserPredictions = Prediction.getAll({ userId });
    const userPredictions = Prediction.findByUserId(userId, 10); // Last 10 predictions
    
    // Calculate time-based filtering
    const timeRange = req.query.timeRange;
    let filteredPredictions = allUserPredictions;
    
    if (timeRange) {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '1month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6months':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      filteredPredictions = allUserPredictions
        .filter(p => new Date(p.createdAt) >= startDate);
    }

    // Calculate stats
    const totalAssessments = filteredPredictions.length;
    const latestPrediction = filteredPredictions.length > 0 ? filteredPredictions[0] : null;
    const latestRisk = latestPrediction ? latestPrediction.risk : 0;
    
    // Calculate trend
    let trendDirection = 'stable';
    let trendChange = 0;
    if (filteredPredictions.length >= 2) {
      const recent = filteredPredictions.slice(0, 2);
      trendChange = (recent[0].risk - recent[1].risk) * 100;
      if (trendChange > 5) trendDirection = 'up';
      else if (trendChange < -5) trendDirection = 'down';
    }

    // Calculate days since last assessment
    const daysSinceLastAssessment = latestPrediction 
      ? Math.floor((new Date() - new Date(latestPrediction.createdAt)) / (1000 * 60 * 60 * 24))
      : 0;

    // Generate risk trend data (last 30 days)
    const riskTrend = [];
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendPredictions = filteredPredictions.filter(p => new Date(p.createdAt) >= last30Days);
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayPredictions = trendPredictions.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate.toDateString() === date.toDateString();
      });
      
      if (dayPredictions.length > 0) {
        const avgRisk = dayPredictions.reduce((sum, p) => sum + p.risk, 0) / dayPredictions.length;
        riskTrend.push({
          date: date.toISOString(),
          risk: avgRisk
        });
      }
    }

    // Calculate risk distribution
    const riskDistribution = {
      low: filteredPredictions.filter(p => p.risk < 0.3).length,
      moderate: filteredPredictions.filter(p => p.risk >= 0.3 && p.risk < 0.7).length,
      high: filteredPredictions.filter(p => p.risk >= 0.7).length
    };

    // Mock symptom frequency data
    const symptomFrequency = [
      { symptom: 'Irregular Periods', count: Math.floor(Math.random() * 10) + 1 },
      { symptom: 'Weight Gain', count: Math.floor(Math.random() * 8) + 1 },
      { symptom: 'Acne', count: Math.floor(Math.random() * 6) + 1 },
      { symptom: 'Hair Growth', count: Math.floor(Math.random() * 5) + 1 },
      { symptom: 'Mood Changes', count: Math.floor(Math.random() * 4) + 1 }
    ];

    // Format recent assessments
    const recentAssessments = userPredictions.slice(0, 5).map(p => ({
      id: p.id,
      risk: p.risk,
      date: p.createdAt,
      hasImage: p.type === 'image' || p.type === 'multimodal'
    }));

    // Generate insights
    const insights = [];
    if (totalAssessments === 0) {
      insights.push({
        title: 'Welcome to FemiHealth!',
        description: 'Take your first PCOS risk assessment to start tracking your health journey.'
      });
    } else {
      if (trendDirection === 'up') {
        insights.push({
          title: 'Risk Trend Alert',
          description: 'Your recent assessments show an increasing risk trend. Consider consulting with a healthcare provider.'
        });
      } else if (trendDirection === 'down') {
        insights.push({
          title: 'Positive Progress',
          description: 'Great news! Your risk levels are showing improvement over time.'
        });
      }
      
      if (latestPrediction && latestPrediction.recommendations.length > 0) {
        insights.push({
          title: 'Latest Recommendation',
          description: latestPrediction.recommendations[0]
        });
      }
      
      if (daysSinceLastAssessment > 30) {
        insights.push({
          title: 'Assessment Reminder',
          description: 'It\'s been a while since your last assessment. Regular monitoring helps track your health trends.'
        });
      }
    }

    const dashboardData = {
      stats: {
        totalAssessments,
        latestRisk,
        trendDirection,
        trendChange,
        daysSinceLastAssessment
      },
      riskTrend: riskTrend.length > 0 ? riskTrend : [],
      riskDistribution,
      symptomFrequency: totalAssessments > 0 ? symptomFrequency : [],
      recentAssessments,
      insights
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
});

app.get('/api/dashboard/profile', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate age from date of birth
    let age = null;
    if (user.dateOfBirth) {
      const birthDate = new Date(user.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        age
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

app.put('/api/dashboard/profile', enhancedAuthMiddleware, profileValidation.update, handleValidationErrors, async (req, res) => {
  try {
    const user = User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user profile
    user.update(req.body);

    // Calculate age from date of birth
    let age = null;
    if (user.dateOfBirth) {
      const birthDate = new Date(user.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        age
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

app.get('/api/dashboard/stats', enhancedAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userPredictions = Prediction.getAll({ userId });
    
    const stats = {
      totalPredictions: userPredictions.length,
      riskDistribution: {
        low: userPredictions.filter(p => p.risk < 0.3).length,
        moderate: userPredictions.filter(p => p.risk >= 0.3 && p.risk < 0.7).length,
        high: userPredictions.filter(p => p.risk >= 0.7).length
      },
      predictionTypes: {
        tabular: userPredictions.filter(p => p.type === 'tabular').length,
        image: userPredictions.filter(p => p.type === 'image').length,
        multimodal: userPredictions.filter(p => p.type === 'multimodal').length
      },
      averageRisk: userPredictions.length > 0 
        ? userPredictions.reduce((sum, p) => sum + p.risk, 0) / userPredictions.length 
        : 0,
      lastPrediction: userPredictions.length > 0 
        ? userPredictions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
        : null
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics'
    });
  }
});

app.get('/api/dashboard/insights', enhancedAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = User.findById(userId);
    const userPredictions = Prediction.getAll({ userId });
    
    let insights = [
      'Welcome to FemiHealth! Your personalized health insights will appear here.',
      'Regular health monitoring helps identify patterns and trends.',
      'Maintain a healthy lifestyle with balanced nutrition and regular exercise.'
    ];

    if (userPredictions.length > 0) {
      const latestPrediction = userPredictions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const averageRisk = userPredictions.reduce((sum, p) => sum + p.risk, 0) / userPredictions.length;
      
      insights = [];
      
      // Risk trend analysis
      if (userPredictions.length >= 2) {
        const recentPredictions = userPredictions.slice(0, 2);
        const riskTrend = recentPredictions[0].risk - recentPredictions[1].risk;
        
        if (riskTrend > 0.1) {
          insights.push('⚠️ Your recent risk assessment shows an increasing trend. Consider consulting with a healthcare provider.');
        } else if (riskTrend < -0.1) {
          insights.push('✅ Great news! Your risk levels are showing improvement over time.');
        } else {
          insights.push('📊 Your risk levels remain stable. Continue monitoring regularly.');
        }
      }
      
      // Personalized recommendations based on latest prediction
      if (latestPrediction.recommendations && latestPrediction.recommendations.length > 0) {
        insights.push(`💡 Latest recommendation: ${latestPrediction.recommendations[0]}`);
      }
      
      // Risk level insights
      const riskLevel = mlModel.getRiskLevel(averageRisk);
      if (riskLevel.level === 'Low') {
        insights.push('🌟 Your overall risk assessment indicates low risk. Keep up the healthy habits!');
      } else if (riskLevel.level === 'Moderate') {
        insights.push('⚡ Your risk level is moderate. Focus on lifestyle improvements and regular monitoring.');
      } else {
        insights.push('🚨 Your risk assessment indicates high risk. Please consult with a healthcare professional.');
      }
      
      // Prediction frequency insights
      if (userPredictions.length >= 5) {
        insights.push('📈 You\'re doing great with regular health monitoring! Consistency is key to understanding your health patterns.');
      }
    }

    res.json({
      success: true,
      data: {
        insights: insights.slice(0, 4), // Return top 4 insights
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get dashboard insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve insights'
    });
  }
});

// Admin routes
app.get('/api/admin/dashboard', enhancedAuthMiddleware, RBACMiddleware.requireAdmin(), RBACMiddleware.auditLog('admin_dashboard_access'), async (req, res) => {
  try {
    const allUsers = User.getAll();
    const allPredictions = Prediction.getAll();
    const predictionStats = Prediction.getStats();
    
    // Calculate user growth (mock data for last 30 days)
    const userGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userGrowth.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1
      });
    }

    const dashboardData = {
      stats: {
        totalUsers: allUsers.length,
        totalPredictions: allPredictions.length,
        activeUsers: allUsers.filter(u => u.status === 'active').length,
        newUsersToday: allUsers.filter(u => {
          const today = new Date().toISOString().split('T')[0];
          return u.createdAt.split('T')[0] === today;
        }).length
      },
      userGrowth,
      predictionStats: {
        low: predictionStats.low,
        moderate: predictionStats.moderate,
        high: predictionStats.high
      },
      recentActivity: allPredictions.slice(0, 10).map(p => ({
        id: p.id,
        userId: p.userId,
        type: p.type,
        risk: p.risk,
        createdAt: p.createdAt
      }))
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard'
    });
  }
});

app.get('/api/admin/stats', enhancedAuthMiddleware, requireViewSystemHealth(), RBACMiddleware.auditLog('admin_stats_access'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPredictions = await Prediction.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Get prediction stats using aggregation
    const predictionStats = await Prediction.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const riskStats = {
      low: predictionStats.find(p => p._id === 'low')?.count || 0,
      moderate: predictionStats.find(p => p._id === 'moderate')?.count || 0,
      high: predictionStats.find(p => p._id === 'high')?.count || 0
    };

    // Get user growth data (last 7 days)
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 7 }
    ]);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPredictions,
          activeUsers
        },
        userGrowth: userGrowth.map(item => ({
          date: item._id,
          count: item.count
        })),
        predictionStats: riskStats
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin statistics'
    });
  }
});

app.get('/api/admin/users', enhancedAuthMiddleware, requireManageUsers(), RBACMiddleware.auditLog('admin_users_list'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await User.find({})
      .select('-password -mfaSecret -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          isEmailVerified: u.isEmailVerified,
          verificationStatus: u.verificationStatus,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

// Get all predictions for admin
app.get('/api/admin/predictions', enhancedAuthMiddleware, requireViewSystemHealth(), RBACMiddleware.auditLog('admin_predictions_list'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const predictions = await Prediction.find({})
      .populate('userId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Prediction.countDocuments();
    
    res.json({
      success: true,
      data: {
        predictions: predictions.map(p => ({
          id: p._id,
          user: p.userId ? {
            id: p.userId._id,
            firstName: p.userId.firstName,
            lastName: p.userId.lastName,
            email: p.userId.email
          } : null,
          doctor: p.doctorId ? {
            id: p.doctorId._id,
            firstName: p.doctorId.firstName,
            lastName: p.doctorId.lastName
          } : null,
          type: p.type,
          purpose: p.purpose,
          risk: p.risk,
          riskLevel: p.riskLevel,
          confidence: p.confidence,
          status: p.status,
          createdAt: p.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve predictions'
    });
  }
});

app.get('/api/admin/users/:id', enhancedAuthMiddleware, requireManageUsers(), RBACMiddleware.auditLog('admin_user_view'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userPredictions = Prediction.getAll({ userId });
    
    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        predictions: userPredictions.length,
        lastPrediction: userPredictions.length > 0 
          ? userPredictions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
          : null
      }
    });
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
});

app.put('/api/admin/users/:id', enhancedAuthMiddleware, requireManageUsers(), RBACMiddleware.auditLog('admin_user_update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from changing their own role
    if (userId === req.user.userId && req.body.role && req.body.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }
    
    user.update(req.body);
    
    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

app.delete('/api/admin/users/:id', enhancedAuthMiddleware, requireManageUsers(), RBACMiddleware.auditLog('admin_user_delete'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deleting themselves
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    user.delete();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

app.get('/api/admin/analytics/predictions', enhancedAuthMiddleware, requireViewSystemHealth(), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build query filter
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const total = await Prediction.countDocuments(query);
    
    // Get type distribution
    const typeStats = await Prediction.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Get risk distribution
    const riskStats = await Prediction.aggregate([
      { $match: query },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);
    
    // Get averages
    const avgStats = await Prediction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRisk: { $avg: '$risk' },
          averageConfidence: { $avg: '$confidence' }
        }
      }
    ]);
    
    const analytics = {
      total,
      byType: {
        tabular: typeStats.find(t => t._id === 'tabular')?.count || 0,
        image: typeStats.find(t => t._id === 'image')?.count || 0,
        multimodal: typeStats.find(t => t._id === 'multimodal')?.count || 0
      },
      byRisk: {
        low: riskStats.find(r => r._id === 'low')?.count || 0,
        moderate: riskStats.find(r => r._id === 'moderate')?.count || 0,
        high: riskStats.find(r => r._id === 'high')?.count || 0
      },
      averageRisk: avgStats[0]?.averageRisk || 0,
      averageConfidence: avgStats[0]?.averageConfidence || 0
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Admin prediction analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction analytics'
    });
  }
});

app.get('/api/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Mock activity logs - in production, implement proper logging
    const mockLogs = [];
    for (let i = 0; i < 100; i++) {
      mockLogs.push({
        id: i + 1,
        userId: Math.floor(Math.random() * 10) + 1,
        action: ['login', 'prediction', 'profile_update', 'logout'][Math.floor(Math.random() * 4)],
        details: 'User performed action',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255)
      });
    }
    
    const offset = (page - 1) * limit;
    const logs = mockLogs.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total: mockLogs.length,
          pages: Math.ceil(mockLogs.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs'
    });
  }
});

app.get('/api/admin/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const systemHealth = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected', // Mock status
        mlModel: 'operational',
        fileStorage: 'operational'
      },
      metrics: {
        totalUsers: User.getAll().length,
        totalPredictions: Prediction.getAll().length,
        activeConnections: 1 // Mock value
      }
    };
    
    res.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health'
    });
  }
});

// Export routes
app.get('/api/export/csv/:dataType', authenticateToken, async (req, res) => {
  try {
    const { dataType } = req.params;
    const userId = req.user.userId;
    let csvData = '';
    let filename = `${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    switch (dataType) {
      case 'predictions':
        const userPredictions = Prediction.getAll({ userId });
        csvData = 'ID,Type,Risk,Confidence,Created At\n';
        csvData += userPredictions.map(p => 
          `${p.id},${p.type},${p.risk.toFixed(3)},${p.confidence.toFixed(3)},${p.createdAt}`
        ).join('\n');
        break;
        
      case 'profile':
        const user = User.findById(userId);
        csvData = 'Field,Value\n';
        csvData += `Name,"${user.firstName} ${user.lastName}"\n`;
        csvData += `Email,${user.email}\n`;
        csvData += `Date of Birth,${user.dateOfBirth || 'N/A'}\n`;
        csvData += `Height,${user.height || 'N/A'}\n`;
        csvData += `Weight,${user.weight || 'N/A'}\n`;
        csvData += `Created At,${user.createdAt}\n`;
        break;
        
      case 'admin-data':
        // Admin-only export
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Admin access required'
          });
        }
        const allUsers = User.getAll();
        csvData = 'ID,Name,Email,Role,Status,Created At,Last Login\n';
        csvData += allUsers.map(u => 
          `${u.id},"${u.firstName} ${u.lastName}",${u.email},${u.role},${u.status},${u.createdAt},${u.lastLogin || 'Never'}`
        ).join('\n');
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid data type for export'
        });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
});

app.get('/api/export/pdf/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.userId;
    
    // Find the prediction/report
    const prediction = Prediction.findById(parseInt(reportId));
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Check ownership
    if (prediction.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Mock PDF generation - in production, use a PDF library like puppeteer or jsPDF
    const pdfContent = `
      FemiHealth PCOS Risk Assessment Report
      =====================================
      
      Report ID: ${prediction.id}
      Date: ${new Date(prediction.createdAt).toLocaleDateString()}
      Type: ${prediction.type.toUpperCase()}
      
      Risk Assessment:
      - Risk Score: ${(prediction.risk * 100).toFixed(1)}%
      - Confidence: ${(prediction.confidence * 100).toFixed(1)}%
      - Risk Level: ${mlModel.getRiskLevel(prediction.risk).level}
      
      Risk Factors:
      ${prediction.factors.map(f => `- ${f}`).join('\n      ')}
      
      Recommendations:
      ${prediction.recommendations.map(r => `- ${r}`).join('\n      ')}
      
      ${prediction.imageAnalysis ? `\n      Image Analysis:\n      ${prediction.imageAnalysis}` : ''}
      
      Generated by FemiHealth AI System
    `;
    
    // Convert to buffer (mock PDF)
    const pdfBuffer = Buffer.from(pdfContent, 'utf8');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="femihealth-report-${reportId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      success: false,
      message: 'PDF export failed'
    });
  }
});

app.get('/api/export/dashboard', authenticateToken, async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    const userId = req.user.userId;
    const user = User.findById(userId);
    const userPredictions = Prediction.getAll({ userId });
    
    if (format === 'pdf') {
      const dashboardContent = `
        FemiHealth Dashboard Summary
        ===========================
        
        User: ${user.firstName} ${user.lastName}
        Email: ${user.email}
        Generated: ${new Date().toLocaleDateString()}
        
        Summary Statistics:
        - Total Predictions: ${userPredictions.length}
        - Average Risk: ${userPredictions.length > 0 ? (userPredictions.reduce((sum, p) => sum + p.risk, 0) / userPredictions.length * 100).toFixed(1) + '%' : 'N/A'}
        - Last Assessment: ${userPredictions.length > 0 ? new Date(userPredictions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt).toLocaleDateString() : 'None'}
        
        Recent Predictions:
        ${userPredictions.slice(0, 5).map(p => 
          `- ${new Date(p.createdAt).toLocaleDateString()}: ${p.type} (Risk: ${(p.risk * 100).toFixed(1)}%)`
        ).join('\n        ')}
        
        Generated by FemiHealth AI System
      `;
      
      const pdfBuffer = Buffer.from(dashboardContent, 'utf8');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="femihealth-dashboard.pdf"');
      res.send(pdfBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported export format'
      });
    }
  } catch (error) {
    console.error('Dashboard export error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard export failed'
    });
  }
});

app.post('/api/export/report', authenticateToken, async (req, res) => {
  try {
    const { reportType, dateRange, includeImages } = req.body;
    const userId = req.user.userId;
    
    // Generate custom report based on configuration
    const reportId = Date.now();
    
    // Mock report generation - in production, this would be async
    setTimeout(() => {
      console.log(`Report ${reportId} generated for user ${userId}`);
    }, 1000);
    
    res.json({
      success: true,
      data: {
        reportId,
        status: 'generating',
        estimatedTime: '2-3 minutes'
      }
    });
  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({
      success: false,
      message: 'Report generation failed'
    });
  }
});

app.get('/api/export/status/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Mock report status - in production, check actual generation status
    const status = Math.random() > 0.5 ? 'completed' : 'generating';
    
    res.json({
      success: true,
      data: {
        reportId,
        status,
        progress: status === 'completed' ? 100 : Math.floor(Math.random() * 80) + 10,
        downloadUrl: status === 'completed' ? `/api/export/download/${reportId}` : null
      }
    });
  } catch (error) {
    console.error('Report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report status'
    });
  }
});

// File upload routes
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileInfo = {
      id: Date.now(),
      originalName: req.file.originalname,
      filename: `${Date.now()}-${req.file.originalname}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date().toISOString(),
      type: req.body.type || 'general'
    };
    
    // In production, save file to storage (AWS S3, local filesystem, etc.)
    console.log('File uploaded:', fileInfo);
    
    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed'
    });
  }
});

app.post('/api/files/upload-multiple', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const uploadedFiles = req.files.map(file => ({
      id: Date.now() + Math.random(),
      originalName: file.originalname,
      filename: `${Date.now()}-${file.originalname}`,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date().toISOString(),
      type: req.body.type || 'general'
    }));
    
    res.json({
      success: true,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Multiple file upload failed'
    });
  }
});

app.delete('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Mock file deletion - in production, delete from storage
    console.log(`File ${fileId} deleted by user ${req.user.userId}`);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'File deletion failed'
    });
  }
});

app.get('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Mock file info - in production, get from database
    const fileInfo = {
      id: fileId,
      originalName: 'sample-ultrasound.jpg',
      filename: `${fileId}-sample-ultrasound.jpg`,
      mimetype: 'image/jpeg',
      size: 1024000,
      uploadedBy: req.user.userId,
      uploadedAt: new Date().toISOString(),
      type: 'image',
      url: `/api/files/download/${fileId}`
    };
    
    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file information'
    });
  }
});

// Educational Content API
app.get('/api/education/articles', async (req, res) => {
  try {
    const articles = [
      {
        id: 1,
        title: 'Understanding PCOS: A Comprehensive Guide',
        summary: 'Learn about the causes, symptoms, and management of PCOS',
        content: 'PCOS is a hormonal disorder affecting women of reproductive age...',
        category: 'general',
        readTime: 5,
        publishedAt: '2024-01-15T10:00:00Z',
        author: 'Dr. Sarah Johnson'
      },
      {
        id: 2,
        title: 'Diet and Lifestyle Changes for PCOS',
        summary: 'Effective dietary strategies to manage PCOS symptoms',
        content: 'A balanced diet can significantly help manage PCOS symptoms...',
        category: 'lifestyle',
        readTime: 7,
        publishedAt: '2024-01-10T14:30:00Z',
        author: 'Dr. Maria Rodriguez'
      }
    ];
    
    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve articles'
    });
  }
});

app.get('/api/education/articles/:id', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const article = {
      id: articleId,
      title: 'Understanding PCOS: A Comprehensive Guide',
      content: 'PCOS (Polycystic Ovary Syndrome) is a hormonal disorder that affects women of reproductive age. It is characterized by irregular menstrual periods, excess androgen levels, and polycystic ovaries...',
      category: 'general',
      readTime: 5,
      publishedAt: '2024-01-15T10:00:00Z',
      author: 'Dr. Sarah Johnson',
      tags: ['PCOS', 'hormones', 'health']
    };
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve article'
    });
  }
});

app.get('/api/education/pcos', async (req, res) => {
  try {
    const pcosInfo = {
      overview: 'PCOS is a hormonal disorder affecting 1 in 10 women of childbearing age.',
      symptoms: [
        'Irregular periods',
        'Excess hair growth',
        'Acne',
        'Weight gain',
        'Difficulty getting pregnant'
      ],
      causes: [
        'Insulin resistance',
        'Inflammation',
        'Heredity',
        'Excess androgen production'
      ],
      treatments: [
        'Lifestyle changes',
        'Medications',
        'Fertility treatments',
        'Regular monitoring'
      ],
      riskFactors: [
        'Family history',
        'Insulin resistance',
        'Obesity',
        'Inflammation'
      ]
    };
    
    res.json({
      success: true,
      data: pcosInfo
    });
  } catch (error) {
    console.error('Get PCOS info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve PCOS information'
    });
  }
});

app.get('/api/education/faq', async (req, res) => {
  try {
    const faq = [
      {
        id: 1,
        question: 'What is PCOS?',
        answer: 'PCOS is a hormonal disorder that affects women of reproductive age, characterized by irregular periods, excess androgen levels, and polycystic ovaries.'
      },
      {
        id: 2,
        question: 'How accurate is the AI prediction?',
        answer: 'Our AI model has been trained on extensive medical data and provides risk assessments with confidence scores. However, it should not replace professional medical diagnosis.'
      },
      {
        id: 3,
        question: 'Is my data secure?',
        answer: 'Yes, we use industry-standard encryption and security measures to protect your personal health information.'
      }
    ];
    
    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve FAQ'
    });
  }
});

app.get('/api/education/resources', async (req, res) => {
  try {
    const resources = [
      {
        id: 1,
        title: 'PCOS Foundation',
        description: 'Leading organization for PCOS awareness and support',
        url: 'https://www.pcosfoundation.org',
        type: 'organization'
      },
      {
        id: 2,
        title: 'Mayo Clinic - PCOS Guide',
        description: 'Comprehensive medical information about PCOS',
        url: 'https://www.mayoclinic.org/diseases-conditions/pcos',
        type: 'medical'
      },
      {
        id: 3,
        title: 'PCOS Diet & Nutrition Guide',
        description: 'Evidence-based dietary recommendations for PCOS management',
        url: 'https://example.com/pcos-diet-guide',
        type: 'lifestyle'
      }
    ];
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resources'
    });
  }
});

// Data Management API
app.post('/api/data', authenticateToken, async (req, res) => {
  try {
    const data = {
      id: Date.now(),
      userId: req.user.userId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Create data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data entry'
    });
  }
});

app.get('/api/data/:id', authenticateToken, async (req, res) => {
  try {
    const dataId = parseInt(req.params.id);
    const mockData = {
      id: dataId,
      userId: req.user.userId,
      type: 'health_record',
      data: { weight: 65, height: 170, bloodPressure: 120 },
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: mockData
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data'
    });
  }
});

app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const mockData = [
      {
        id: 1,
        userId: req.user.userId,
        type: 'health_record',
        data: { weight: 65, height: 170 },
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: mockData
    });
  } catch (error) {
    console.error('Get all data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data'
    });
  }
});

app.put('/api/data/:id', authenticateToken, async (req, res) => {
  try {
    const dataId = parseInt(req.params.id);
    const updatedData = {
      id: dataId,
      userId: req.user.userId,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    console.error('Update data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data'
    });
  }
});

app.delete('/api/data/:id', authenticateToken, async (req, res) => {
  try {
    const dataId = parseInt(req.params.id);
    
    res.json({
      success: true,
      message: 'Data deleted successfully'
    });
  } catch (error) {
    console.error('Delete data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete data'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FemiHealth Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
