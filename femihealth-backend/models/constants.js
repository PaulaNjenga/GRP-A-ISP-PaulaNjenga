// User Roles
const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};

// Permissions
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

// Role-based permissions mapping
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

module.exports = {
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
};
