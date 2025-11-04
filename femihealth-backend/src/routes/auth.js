import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  verifyToken,
  setupMFA,
  verifyMFA,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // Accept either name or firstName/lastName combination
  body('name').optional().trim(),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['female', 'male', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', [body('email').isEmail()], forgotPassword);
router.post('/reset-password/:token', [body('password').isLength({ min: 6 })], resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/verify', verifyToken);
router.post('/mfa/setup', setupMFA);
router.post('/mfa/verify', verifyMFA);
router.post('/change-password', changePassword);
router.post('/resend-verification', resendVerification);

export default router;
