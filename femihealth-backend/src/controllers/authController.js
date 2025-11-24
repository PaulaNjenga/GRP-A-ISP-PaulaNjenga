import { validationResult } from 'express-validator';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { name, firstName, lastName, email, password, role, phone, dateOfBirth, gender } = req.body;

    // Handle both name formats (single name or firstName + lastName)
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    
    if (!fullName) {
      return res.status(400).json({ 
        success: false,
        message: 'Name is required' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create user with all provided fields
    const userData = {
      name: fullName,
      email,
      password,
      role: role || 'user',
    };

    // Add optional fields if provided
    if (phone) userData.phone = phone;
    if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
    if (gender) userData.gender = gender;

    const user = await User.create(userData);

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue registration even if email fails
    }

    // Generate JWT token
    const token = generateToken(user._id, { mfaVerified: !user.mfaEnabled });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          mfaVerified: !user.mfaEnabled,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration', 
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user and verify password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('Login successful for:', email, 'Role:', user.role);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Simple MFA logic: if MFA enabled, require verification
    if (user.mfaEnabled) {
      const tempToken = generateToken(user._id, { mfaVerified: false });
      return res.json({
        success: true,
        mfaRequired: true,
        tempToken,
        message: 'MFA verification required'
      });
    }

    // No MFA - full access token
    const token = generateToken(user._id, { mfaVerified: true });
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          mfaVerified: true,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        mfaEnabled: req.user.mfaEnabled,
      },
    },
  });
};

// @desc    Setup MFA
// @route   POST /api/auth/mfa/setup
// @access  Private
export const setupMFA = async (req, res) => {
  try {
    console.log('🔧 Setting up MFA for user:', req.user.email);
    
    const secret = speakeasy.generateSecret({
      name: `FemiHealth (${req.user.email})`,
      issuer: 'FemiHealth',
    });
    
    console.log('✅ Secret generated');

    req.user.mfaSecret = secret.base32;
    await req.user.save();
    
    console.log('✅ Secret saved to user');

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    console.log('✅ QR code generated');

    res.json({
      success: true,
      data: {
        qrCode,
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
      },
    });
  } catch (error) {
    console.error('❌ MFA setup error:', error);
    res.status(500).json({ message: 'MFA setup failed', error: error.message });
  }
};

// @desc    Verify MFA
// @route   POST /api/auth/mfa/verify
// @access  Private
export const verifyMFA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({ message: 'Invalid 6-digit code' });
    }

    const user = await User.findById(req.user._id).select('+mfaSecret');
    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'MFA not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token.toString(),
      window: 2,
    });

    if (verified) {
      user.mfaEnabled = true;
      await user.save();

      res.json({
        success: true,
        data: {
          token: generateToken(user._id, { mfaVerified: true }),
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mfaEnabled: true,
            mfaVerified: true,
          },
        },
      });
    } else {
      res.status(400).json({ message: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ message: 'MFA verification failed', error: error.message });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user, resetToken);
      res.json({
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new JWT token
    const jwtToken = generateToken(user._id, { mfaVerified: !user.mfaEnabled });

    res.json({
      success: true,
      message: 'Password reset successful',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          mfaVerified: !user.mfaEnabled,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if welcome email fails
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id, { mfaVerified: !user.mfaEnabled });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          mfaVerified: !user.mfaEnabled,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
      res.json({
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
