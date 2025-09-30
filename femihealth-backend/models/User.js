const crypto = require('crypto');

// In-memory user storage (replace with database in production)
const users = new Map();
const predictions = new Map();
const anonymizedData = new Map(); // Store anonymized versions
let userIdCounter = 1;
let predictionIdCounter = 1;

// User roles and permissions
const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor', 
  ADMIN: 'admin'
};

const PERMISSIONS = {
  // Patient permissions
  SELF_PREDICT: 'self_predict',
  VIEW_OWN_RESULTS: 'view_own_results',
  
  // Doctor permissions
  DIAGNOSE: 'diagnose',
  UPLOAD_TESTS: 'upload_tests',
  VIEW_PATIENT_DATA: 'view_patient_data',
  CREATE_DIAGNOSIS: 'create_diagnosis',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  VIEW_SYSTEM_HEALTH: 'view_system_health',
  MANAGE_SECURITY: 'manage_security',
  VIEW_ANALYTICS: 'view_analytics'
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.PATIENT]: [
    PERMISSIONS.SELF_PREDICT,
    PERMISSIONS.VIEW_OWN_RESULTS
  ],
  [USER_ROLES.DOCTOR]: [
    PERMISSIONS.SELF_PREDICT,
    PERMISSIONS.VIEW_OWN_RESULTS,
    PERMISSIONS.DIAGNOSE,
    PERMISSIONS.UPLOAD_TESTS,
    PERMISSIONS.VIEW_PATIENT_DATA,
    PERMISSIONS.CREATE_DIAGNOSIS
  ],
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_SYSTEM_HEALTH,
    PERMISSIONS.MANAGE_SECURITY,
    PERMISSIONS.VIEW_ANALYTICS
  ]
};

// Anonymization utilities
class AnonymizationUtils {
  static generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  static generateAnonymousId(email) {
    return 'anon_' + this.generateHash(email).substring(0, 12);
  }
  
  static anonymizeEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? 
      local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : 
      '*'.repeat(local.length);
    return `${maskedLocal}@${domain}`;
  }
  
  static anonymizeName(name) {
    if (!name || name.length === 0) return '';
    return name[0] + '*'.repeat(Math.max(0, name.length - 1));
  }
  
  static anonymizeDate(dateString) {
    const date = new Date(dateString);
    // Only keep year and month, set day to 1
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }
}

class User {
  constructor(userData) {
    this.id = userIdCounter++;
    
    // PII fields (stored securely, not in logs)
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.email = userData.email;
    this.password = userData.password; // Should be hashed in production
    this.dateOfBirth = userData.dateOfBirth;
    
    // Anonymous identifier for analytics
    this.anonymousId = AnonymizationUtils.generateAnonymousId(userData.email);
    
    // Medical data
    this.height = userData.height || null;
    this.weight = userData.weight || null;
    this.medicalHistory = userData.medicalHistory || [];
    this.medications = userData.medications || [];
    this.allergies = userData.allergies || [];
    
    // Role and permissions
    this.role = userData.role || USER_ROLES.PATIENT;
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
    this.status = 'active';
    
    // Doctor-specific fields
    this.licenseNumber = userData.licenseNumber || null;
    this.specialization = userData.specialization || null;
    this.hospital = userData.hospital || null;
    this.verificationStatus = userData.verificationStatus || 'pending';
    
    // Security
    this.mfaEnabled = false;
    this.mfaSecret = null;
    
    // Timestamps
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.lastLogin = null;
    
    // Create anonymized version immediately
    this.createAnonymizedVersion();
  }
  
  createAnonymizedVersion() {
    const anonymized = {
      anonymousId: this.anonymousId,
      role: this.role,
      ageGroup: this.getAgeGroup(),
      heightRange: this.getHeightRange(),
      weightRange: this.getWeightRange(),
      hasConditions: this.medicalHistory.length > 0,
      conditionCount: this.medicalHistory.length,
      medicationCount: this.medications.length,
      allergyCount: this.allergies.length,
      createdMonth: new Date(this.createdAt).toISOString().substring(0, 7), // YYYY-MM
      status: this.status
    };
    
    anonymizedData.set(this.anonymousId, anonymized);
    return anonymized;
  }
  
  getAgeGroup() {
    if (!this.dateOfBirth) return 'unknown';
    const age = new Date().getFullYear() - new Date(this.dateOfBirth).getFullYear();
    if (age < 18) return 'under-18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }
  
  getHeightRange() {
    if (!this.height) return 'unknown';
    if (this.height < 150) return 'under-150';
    if (this.height < 160) return '150-159';
    if (this.height < 170) return '160-169';
    if (this.height < 180) return '170-179';
    return '180+';
  }
  
  getWeightRange() {
    if (!this.weight) return 'unknown';
    if (this.weight < 50) return 'under-50';
    if (this.weight < 60) return '50-59';
    if (this.weight < 70) return '60-69';
    if (this.weight < 80) return '70-79';
    return '80+';
  }
  
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }
  
  hasRole(role) {
    return this.role === role;
  }
  
  isDoctor() {
    return this.role === USER_ROLES.DOCTOR;
  }
  
  isPatient() {
    return this.role === USER_ROLES.PATIENT;
  }
  
  isAdmin() {
    return this.role === USER_ROLES.ADMIN;
  }

  static create(userData) {
    const user = new User(userData);
    users.set(user.id, user);
    return user;
  }

  static findById(id) {
    return users.get(parseInt(id));
  }

  static findByEmail(email) {
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  static getAll(filters = {}) {
    let userList = Array.from(users.values());
    
    if (filters.role) {
      userList = userList.filter(user => user.role === filters.role);
    }
    
    if (filters.status) {
      userList = userList.filter(user => user.status === filters.status);
    }
    
    return userList;
  }

  update(updateData) {
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'anonymousId' && updateData[key] !== undefined) {
        this[key] = updateData[key];
      }
    });
    
    // Update role permissions if role changed
    if (updateData.role) {
      this.permissions = ROLE_PERMISSIONS[updateData.role] || [];
    }
    
    this.updatedAt = new Date().toISOString();
    users.set(this.id, this);
    
    // Update anonymized version
    this.createAnonymizedVersion();
    
    return this;
  }

  delete() {
    return users.delete(this.id);
  }

  toJSON() {
    const { password, mfaSecret, ...userWithoutSensitive } = this;
    return userWithoutSensitive;
  }
  
  // Return anonymized version for analytics/logging
  toAnonymized() {
    return anonymizedData.get(this.anonymousId);
  }
  
  // Return safe version for API responses (masks PII)
  toSafeJSON() {
    return {
      id: this.id,
      anonymousId: this.anonymousId,
      firstName: AnonymizationUtils.anonymizeName(this.firstName),
      lastName: AnonymizationUtils.anonymizeName(this.lastName),
      email: AnonymizationUtils.anonymizeEmail(this.email),
      dateOfBirth: AnonymizationUtils.anonymizeDate(this.dateOfBirth),
      role: this.role,
      permissions: this.permissions,
      status: this.status,
      ageGroup: this.getAgeGroup(),
      heightRange: this.getHeightRange(),
      weightRange: this.getWeightRange(),
      licenseNumber: this.licenseNumber ? 'LIC***' + this.licenseNumber.slice(-4) : null,
      specialization: this.specialization,
      hospital: this.hospital,
      verificationStatus: this.verificationStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }
  
  // Return doctor profile for patients to see
  toDoctorProfile() {
    if (!this.isDoctor()) return null;
    
    return {
      id: this.id,
      name: `Dr. ${this.firstName} ${this.lastName[0]}.`,
      specialization: this.specialization,
      hospital: this.hospital,
      verificationStatus: this.verificationStatus,
      yearsOfExperience: this.getYearsOfExperience()
    };
  }
  
  getYearsOfExperience() {
    if (!this.createdAt) return 0;
    return Math.floor((new Date() - new Date(this.createdAt)) / (365.25 * 24 * 60 * 60 * 1000));
  }
  
  static getAnonymizedStats() {
    return Array.from(anonymizedData.values());
  }
}

class Prediction {
  constructor(predictionData) {
    this.id = predictionIdCounter++;
    this.userId = predictionData.userId;
    this.doctorId = predictionData.doctorId || null; // Doctor who made the diagnosis
    this.type = predictionData.type; // 'tabular', 'image', 'multimodal'
    this.purpose = predictionData.purpose || 'self_assessment'; // 'self_assessment', 'diagnosis'
    
    // Anonymized user identifier for analytics
    const user = users.get(predictionData.userId);
    this.anonymousUserId = user ? user.anonymousId : null;
    
    // Prediction data
    this.inputData = predictionData.inputData;
    this.risk = predictionData.risk;
    this.confidence = predictionData.confidence;
    this.factors = predictionData.factors || [];
    this.recommendations = predictionData.recommendations || [];
    
    // Doctor-specific features
    this.imageAnalysis = predictionData.imageAnalysis || null;
    this.testResults = predictionData.testResults || null;
    this.clinicalNotes = predictionData.clinicalNotes || null;
    this.diagnosis = predictionData.diagnosis || null;
    this.treatmentPlan = predictionData.treatmentPlan || null;
    this.followUpDate = predictionData.followUpDate || null;
    
    // File attachments
    this.attachments = predictionData.attachments || [];
    
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
  
  // Return anonymized version for analytics
  toAnonymized() {
    return {
      id: this.id,
      anonymousUserId: this.anonymousUserId,
      type: this.type,
      purpose: this.purpose,
      risk: this.risk,
      confidence: this.confidence,
      factorCount: this.factors.length,
      hasImageAnalysis: !!this.imageAnalysis,
      hasTestResults: !!this.testResults,
      hasDiagnosis: !!this.diagnosis,
      createdMonth: new Date(this.createdAt).toISOString().substring(0, 7),
      doctorInvolved: !!this.doctorId
    };
  }
  
  // Return safe version for patient view
  toPatientView() {
    const doctor = this.doctorId ? users.get(this.doctorId) : null;
    
    return {
      id: this.id,
      type: this.type,
      purpose: this.purpose,
      risk: this.risk,
      confidence: this.confidence,
      factors: this.factors,
      recommendations: this.recommendations,
      diagnosis: this.diagnosis,
      treatmentPlan: this.treatmentPlan,
      followUpDate: this.followUpDate,
      doctor: doctor ? doctor.toDoctorProfile() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  // Return full version for doctors
  toDoctorView() {
    return {
      ...this,
      patient: this.getPatientInfo()
    };
  }
  
  getPatientInfo() {
    const user = users.get(this.userId);
    if (!user) return null;
    
    return {
      id: user.id,
      anonymousId: user.anonymousId,
      ageGroup: user.getAgeGroup(),
      heightRange: user.getHeightRange(),
      weightRange: user.getWeightRange(),
      medicalHistory: user.medicalHistory,
      medications: user.medications,
      allergies: user.allergies
    };
  }

  static create(predictionData) {
    const prediction = new Prediction(predictionData);
    predictions.set(prediction.id, prediction);
    return prediction;
  }

  static findById(id) {
    return predictions.get(parseInt(id));
  }

  static findByUserId(userId, limit = 10, offset = 0) {
    const userPredictions = Array.from(predictions.values())
      .filter(p => p.userId === parseInt(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit);
    
    return userPredictions;
  }

  static getAll(filters = {}) {
    let predictionList = Array.from(predictions.values());
    
    if (filters.userId) {
      predictionList = predictionList.filter(p => p.userId === parseInt(filters.userId));
    }
    
    if (filters.type) {
      predictionList = predictionList.filter(p => p.type === filters.type);
    }
    
    return predictionList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static getStats() {
    const allPredictions = Array.from(predictions.values());
    const total = allPredictions.length;
    const low = allPredictions.filter(p => p.risk < 0.3).length;
    const moderate = allPredictions.filter(p => p.risk >= 0.3 && p.risk < 0.7).length;
    const high = allPredictions.filter(p => p.risk >= 0.7).length;
    
    const selfAssessments = allPredictions.filter(p => p.purpose === 'self_assessment').length;
    const diagnoses = allPredictions.filter(p => p.purpose === 'diagnosis').length;
    
    return { 
      total, 
      low, 
      moderate, 
      high,
      selfAssessments,
      diagnoses,
      withDoctorInvolvement: allPredictions.filter(p => p.doctorId).length
    };
  }
  
  static getAnonymizedStats() {
    return Array.from(predictions.values()).map(p => p.toAnonymized());
  }
}

// Initialize with some sample data
const sampleUsers = [
  // Test Patient User
  {
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'patient@test.com',
    password: 'patient123',
    dateOfBirth: '1995-08-15',
    height: 165,
    weight: 58,
    role: USER_ROLES.PATIENT,
    medicalHistory: ['Irregular periods', 'Family history of PCOS'],
    medications: ['Multivitamin'],
    allergies: ['Penicillin']
  },
  // Test Doctor User
  {
    firstName: 'Dr. Michael',
    lastName: 'Rodriguez',
    email: 'doctor@test.com',
    password: 'doctor123',
    dateOfBirth: '1980-04-12',
    role: USER_ROLES.DOCTOR,
    licenseNumber: 'MD789012',
    specialization: 'Endocrinology & PCOS Specialist',
    hospital: 'Women\'s Health Medical Center',
    verificationStatus: 'verified'
  },
  // Test Admin User
  {
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@test.com',
    password: 'admin123',
    dateOfBirth: '1985-01-01',
    role: USER_ROLES.ADMIN
  }
];

sampleUsers.forEach(userData => User.create(userData));

// Sample predictions
const samplePredictions = [
  {
    userId: 1,
    type: 'tabular',
    purpose: 'self_assessment',
    inputData: { age: 28, weight: 60, height: 165, bmi: 22.0 },
    risk: 0.25,
    confidence: 0.85,
    factors: ['BMI', 'Age'],
    recommendations: ['Maintain healthy weight', 'Regular exercise']
  },
  {
    userId: 1,
    doctorId: 2,
    type: 'multimodal',
    purpose: 'diagnosis',
    inputData: { age: 28, weight: 62, height: 165 },
    risk: 0.45,
    confidence: 0.78,
    factors: ['BMI', 'Ultrasound findings', 'Hormone levels'],
    recommendations: ['Monitor weight', 'Follow up in 3 months'],
    imageAnalysis: 'Ultrasound shows polycystic ovaries with 12+ follicles',
    testResults: {
      testosterone: 'elevated',
      insulin: 'normal',
      lh_fsh_ratio: 'elevated'
    },
    diagnosis: 'PCOS - Polycystic Ovary Syndrome',
    treatmentPlan: 'Lifestyle modifications, metformin if needed',
    followUpDate: '2024-01-15',
    clinicalNotes: 'Patient presents with irregular periods and weight gain'
  }
];

samplePredictions.forEach(predData => Prediction.create(predData));

module.exports = { 
  User, 
  Prediction, 
  USER_ROLES, 
  PERMISSIONS, 
  ROLE_PERMISSIONS,
  AnonymizationUtils 
};
