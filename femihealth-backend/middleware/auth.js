const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Admin Role Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Validation Middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation Rules
const authValidation = {
  register: [
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
    body('height').optional().isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100-250 cm'),
    body('weight').optional().isFloat({ min: 30, max: 300 }).withMessage('Weight must be between 30-300 kg')
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain uppercase, lowercase, number and special character')
  ]
};

const predictionValidation = {
  tabular: [
    body('age').isInt({ min: 12, max: 100 }).withMessage('Age must be between 12-100'),
    body('weight').isFloat({ min: 30, max: 300 }).withMessage('Weight must be between 30-300 kg'),
    body('height').isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100-250 cm'),
    body('cycle_length').optional().isInt({ min: 20, max: 45 }).withMessage('Cycle length must be between 20-45 days'),
    body('pregnancies').optional().isInt({ min: 0, max: 20 }).withMessage('Pregnancies must be 0-20'),
    body('glucose').optional().isFloat({ min: 50, max: 400 }).withMessage('Glucose must be between 50-400 mg/dL'),
    body('blood_pressure').optional().isInt({ min: 80, max: 200 }).withMessage('Blood pressure must be between 80-200 mmHg'),
    body('insulin').optional().isFloat({ min: 0, max: 100 }).withMessage('Insulin must be between 0-100 μU/mL'),
    body('bmi').optional().isFloat({ min: 10, max: 60 }).withMessage('BMI must be between 10-60'),
    body('family_history').optional().isBoolean().withMessage('Family history must be true/false'),
    body('irregular_periods').optional().isBoolean().withMessage('Irregular periods must be true/false'),
    body('weight_gain').optional().isBoolean().withMessage('Weight gain must be true/false'),
    body('hair_growth').optional().isBoolean().withMessage('Hair growth must be true/false'),
    body('acne').optional().isBoolean().withMessage('Acne must be true/false'),
    body('mood_swings').optional().isBoolean().withMessage('Mood swings must be true/false')
  ]
};

const profileValidation = {
  update: [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
    body('height').optional().isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100-250 cm'),
    body('weight').optional().isFloat({ min: 30, max: 300 }).withMessage('Weight must be between 30-300 kg'),
    body('medicalHistory').optional().isArray().withMessage('Medical history must be an array'),
    body('medications').optional().isArray().withMessage('Medications must be an array'),
    body('allergies').optional().isArray().withMessage('Allergies must be an array')
  ]
};

module.exports = {
  authenticateToken,
  requireAdmin,
  handleValidationErrors,
  authValidation,
  predictionValidation,
  profileValidation
};
