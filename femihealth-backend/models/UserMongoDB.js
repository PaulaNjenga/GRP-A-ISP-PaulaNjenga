const mongoose = require('mongoose');
const userSchema = require('./schemas/UserSchema');
const predictionSchema = require('./schemas/PredictionSchema');
const { USER_ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('./constants');

// Create models
const User = mongoose.model('User', userSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);

// Utility class for anonymization (keeping the same interface)
class AnonymizationUtils {
  static generateHash(input) {
    return require('crypto').createHash('sha256').update(input).digest('hex');
  }

  static generateAnonymousId(email) {
    const hash = this.generateHash(email);
    return `anon_${hash.substring(0, 12)}`;
  }

  static anonymizeEmail(email) {
    if (!email) return '';
    const [local, domain] = email.split('@');
    const anonymizedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local[0] + '*'.repeat(local.length - 1);
    return `${anonymizedLocal}@${domain}`;
  }

  static anonymizeName(name) {
    if (!name) return '';
    return name.length > 1 
      ? name[0] + '*'.repeat(name.length - 1)
      : name;
  }

  static anonymizeDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().substring(0, 7); // YYYY-MM
  }

  static anonymizeLicenseNumber(license) {
    if (!license) return '';
    return license.length > 4 
      ? 'LIC***' + license.slice(-4)
      : 'LIC***';
  }
}

module.exports = { 
  User, 
  Prediction, 
  USER_ROLES, 
  PERMISSIONS, 
  ROLE_PERMISSIONS,
  AnonymizationUtils 
};
