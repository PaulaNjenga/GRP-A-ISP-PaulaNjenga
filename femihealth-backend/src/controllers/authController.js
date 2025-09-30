import { validationResult } from 'express-validator';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

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

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
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

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

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
        },
      },
    });
  } catch (error) {
    console.error(error);
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
    const secret = speakeasy.generateSecret({
      name: `FemiHealth (${req.user.email})`,
      issuer: 'FemiHealth',
    });

    // Save secret to user
    req.user.mfaSecret = secret.base32;
    await req.user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        qrCode: qrCodeUrl,
      },
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during MFA setup', 
      error: error.message 
    });
  }
};

// @desc    Verify MFA
// @route   POST /api/auth/mfa/verify
// @access  Private
export const verifyMFA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid token format. Please enter a 6-digit code.' 
      });
    }

    const user = await User.findById(req.user._id).select('+mfaSecret');

    if (!user.mfaSecret) {
      return res.status(400).json({ 
        success: false,
        message: 'MFA not set up. Please set up MFA first.' 
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token.toString(),
      window: 2, // Allow 2 time steps before/after for clock skew
    });

    if (verified) {
      user.mfaEnabled = true;
      await user.save();

      res.json({
        success: true,
        data: {
          message: 'MFA enabled successfully',
          mfaEnabled: true,
        },
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Invalid verification code. Please try again.' 
      });
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during MFA verification', 
      error: error.message 
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In production, send email with reset link
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset email sent',
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
