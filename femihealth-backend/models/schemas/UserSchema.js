const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { USER_ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('../constants');

// User Schema
const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.PATIENT,
    required: true
  },
  permissions: [{
    type: String,
    enum: Object.values(PERMISSIONS)
  }],
  
  // Anonymization
  anonymousId: {
    type: String,
    unique: true,
    index: true
  },
  anonymizedData: {
    ageGroup: String,
    heightRange: String,
    weightRange: String,
    createdMonth: String
  },
  
  // Physical Information (for patients)
  height: {
    type: Number,
    min: 100,
    max: 250
  },
  weight: {
    type: Number,
    min: 30,
    max: 300
  },
  
  // Medical Information
  medicalHistory: [String],
  medications: [String],
  allergies: [String],
  
  // Contact Information
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Doctor-specific fields
  licenseNumber: {
    type: String,
    sparse: true, // Allows multiple null values
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  hospital: {
    type: String,
    trim: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  yearsOfExperience: Number,
  
  // Security
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: String,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Profile
  profilePhoto: String,
  bio: String,
  
  // Privacy Settings
  profileVisibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  dataSharing: {
    research: { type: Boolean, default: false },
    analytics: { type: Boolean, default: true },
    thirdParty: { type: Boolean, default: false }
  },
  
  // Notification Preferences
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    assessmentReminders: { type: Boolean, default: true },
    healthInsights: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ anonymousId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ verificationStatus: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for BMI calculation
userSchema.virtual('bmi').get(function() {
  if (!this.height || !this.weight) return null;
  const heightInMeters = this.height / 100;
  return parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Generate anonymous ID if new user
  if (this.isNew) {
    this.anonymousId = this.generateAnonymousId();
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
    this.createAnonymizedData();
  }
  
  // Update permissions if role changed
  if (this.isModified('role')) {
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
  }
  
  // Update anonymized data if relevant fields changed
  if (this.isModified(['dateOfBirth', 'height', 'weight'])) {
    this.createAnonymizedData();
  }
  
  next();
});

// Instance Methods
userSchema.methods.generateAnonymousId = function() {
  const hash = crypto.createHash('sha256').update(this.email).digest('hex');
  return `anon_${hash.substring(0, 12)}`;
};

userSchema.methods.createAnonymizedData = function() {
  this.anonymizedData = {
    ageGroup: this.getAgeGroup(),
    heightRange: this.getHeightRange(),
    weightRange: this.getWeightRange(),
    createdMonth: new Date().toISOString().substring(0, 7) // YYYY-MM
  };
};

userSchema.methods.getAgeGroup = function() {
  const age = this.age;
  if (!age) return 'unknown';
  if (age < 18) return 'under-18';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
};

userSchema.methods.getHeightRange = function() {
  if (!this.height) return 'unknown';
  if (this.height < 150) return 'under-150';
  if (this.height < 160) return '150-159';
  if (this.height < 170) return '160-169';
  if (this.height < 180) return '170-179';
  return '180+';
};

userSchema.methods.getWeightRange = function() {
  if (!this.weight) return 'unknown';
  if (this.weight < 50) return 'under-50';
  if (this.weight < 60) return '50-59';
  if (this.weight < 70) return '60-69';
  if (this.weight < 80) return '70-79';
  return '80+';
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

userSchema.methods.isDoctor = function() {
  return this.role === USER_ROLES.DOCTOR;
};

userSchema.methods.isPatient = function() {
  return this.role === USER_ROLES.PATIENT;
};

userSchema.methods.isAdmin = function() {
  return this.role === USER_ROLES.ADMIN;
};

userSchema.methods.toSafeJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.mfaSecret;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  
  // Anonymize sensitive fields
  if (obj.email) {
    obj.email = this.anonymizeEmail(obj.email);
  }
  if (obj.licenseNumber) {
    obj.licenseNumber = this.anonymizeLicenseNumber(obj.licenseNumber);
  }
  
  return obj;
};

userSchema.methods.toAnonymized = function() {
  return {
    anonymousId: this.anonymousId,
    role: this.role,
    ageGroup: this.anonymizedData?.ageGroup || this.getAgeGroup(),
    heightRange: this.anonymizedData?.heightRange || this.getHeightRange(),
    weightRange: this.anonymizedData?.weightRange || this.getWeightRange(),
    createdMonth: this.anonymizedData?.createdMonth || this.createdAt.toISOString().substring(0, 7),
    verificationStatus: this.verificationStatus,
    specialization: this.specialization,
    status: this.isActive ? 'active' : 'inactive'
  };
};

userSchema.methods.toDoctorProfile = function() {
  if (!this.isDoctor()) return null;
  
  return {
    id: this._id,
    name: `${this.firstName} ${this.lastName}`,
    specialization: this.specialization,
    hospital: this.hospital,
    yearsOfExperience: this.yearsOfExperience,
    verificationStatus: this.verificationStatus,
    bio: this.bio,
    profilePhoto: this.profilePhoto
  };
};

userSchema.methods.anonymizeEmail = function(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  const anonymizedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : local[0] + '*'.repeat(local.length - 1);
  return `${anonymizedLocal}@${domain}`;
};

userSchema.methods.anonymizeLicenseNumber = function(license) {
  if (!license) return '';
  return license.length > 4 
    ? 'LIC***' + license.slice(-4)
    : 'LIC***';
};

// Static Methods
userSchema.statics.getAnonymizedStats = function() {
  return this.aggregate([
    {
      $project: {
        anonymousId: 1,
        role: 1,
        ageGroup: '$anonymizedData.ageGroup',
        heightRange: '$anonymizedData.heightRange',
        weightRange: '$anonymizedData.weightRange',
        createdMonth: '$anonymizedData.createdMonth',
        verificationStatus: 1,
        specialization: 1,
        status: { $cond: { if: '$isActive', then: 'active', else: 'inactive' } }
      }
    }
  ]);
};

module.exports = userSchema;
