// Permission definitions for role-based access control

export const PERMISSIONS = {
  // User Management
  'users.view': {
    description: 'View user list',
    roles: ['admin'],
  },
  'users.view.own': {
    description: 'View own user profile',
    roles: ['user', 'doctor', 'admin'],
  },
  'users.create': {
    description: 'Create new users',
    roles: ['admin'],
  },
  'users.update': {
    description: 'Update any user',
    roles: ['admin'],
  },
  'users.update.own': {
    description: 'Update own profile',
    roles: ['user', 'doctor', 'admin'],
  },
  'users.delete': {
    description: 'Delete users',
    roles: ['admin'],
  },
  'users.manage.roles': {
    description: 'Manage user roles',
    roles: ['admin'],
  },

  // Predictions
  'predictions.create': {
    description: 'Create new predictions',
    roles: ['user', 'doctor', 'admin'],
  },
  'predictions.view.own': {
    description: 'View own predictions',
    roles: ['user', 'doctor', 'admin'],
  },
  'predictions.view.all': {
    description: 'View all predictions',
    roles: ['doctor', 'admin'],
  },
  'predictions.update.own': {
    description: 'Update own predictions',
    roles: ['user', 'doctor', 'admin'],
  },
  'predictions.delete.own': {
    description: 'Delete own predictions',
    roles: ['user', 'doctor', 'admin'],
  },
  'predictions.delete.any': {
    description: 'Delete any prediction',
    roles: ['admin'],
  },

  // Prediction Reviews
  'predictions.review': {
    description: 'Review and approve predictions',
    roles: ['doctor', 'admin'],
  },
  'predictions.review.assign': {
    description: 'Assign predictions for review',
    roles: ['admin'],
  },

  // Diagnoses
  'diagnoses.create': {
    description: 'Create diagnoses',
    roles: ['doctor', 'admin'],
  },
  'diagnoses.view': {
    description: 'View diagnoses',
    roles: ['doctor', 'admin'],
  },
  'diagnoses.view.own': {
    description: 'View own diagnoses',
    roles: ['user', 'doctor', 'admin'],
  },
  'diagnoses.update': {
    description: 'Update diagnoses',
    roles: ['doctor', 'admin'],
  },
  'diagnoses.delete': {
    description: 'Delete diagnoses',
    roles: ['admin'],
  },

  // Medical Records
  'records.view.own': {
    description: 'View own medical records',
    roles: ['user', 'doctor', 'admin'],
  },
  'records.view.all': {
    description: 'View all medical records',
    roles: ['doctor', 'admin'],
  },
  'records.update.own': {
    description: 'Update own medical records',
    roles: ['user', 'doctor', 'admin'],
  },
  'records.update.any': {
    description: 'Update any medical record',
    roles: ['doctor', 'admin'],
  },

  // Analytics & Reports
  'analytics.view': {
    description: 'View analytics dashboard',
    roles: ['admin'],
  },
  'analytics.export': {
    description: 'Export analytics data',
    roles: ['admin'],
  },
  'reports.generate': {
    description: 'Generate reports',
    roles: ['doctor', 'admin'],
  },
  'reports.view.own': {
    description: 'View own reports',
    roles: ['user', 'doctor', 'admin'],
  },

  // System Administration
  'system.settings': {
    description: 'Manage system settings',
    roles: ['admin'],
  },
  'system.logs': {
    description: 'View system logs',
    roles: ['admin'],
  },
  'system.backup': {
    description: 'Manage backups',
    roles: ['admin'],
  },

  // File Management
  'files.upload': {
    description: 'Upload files',
    roles: ['user', 'doctor', 'admin'],
  },
  'files.view.own': {
    description: 'View own files',
    roles: ['user', 'doctor', 'admin'],
  },
  'files.view.all': {
    description: 'View all files',
    roles: ['doctor', 'admin'],
  },
  'files.delete.own': {
    description: 'Delete own files',
    roles: ['user', 'doctor', 'admin'],
  },
  'files.delete.any': {
    description: 'Delete any file',
    roles: ['admin'],
  },

  // Notifications
  'notifications.send': {
    description: 'Send notifications',
    roles: ['doctor', 'admin'],
  },
  'notifications.manage': {
    description: 'Manage notification settings',
    roles: ['admin'],
  },
};

// Get all permissions for a specific role
export const getRolePermissions = (role) => {
  const permissions = [];
  
  for (const [permission, config] of Object.entries(PERMISSIONS)) {
    if (config.roles.includes(role)) {
      permissions.push(permission);
    }
  }
  
  return permissions;
};

// Check if a role has a specific permission
export const hasPermission = (role, permission) => {
  const permissionConfig = PERMISSIONS[permission];
  if (!permissionConfig) {
    return false;
  }
  return permissionConfig.roles.includes(role);
};

// Check if a user has multiple permissions (AND logic)
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

// Check if a user has at least one permission (OR logic)
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

// Get permission description
export const getPermissionDescription = (permission) => {
  return PERMISSIONS[permission]?.description || 'Unknown permission';
};

// Get all available permissions
export const getAllPermissions = () => {
  return Object.keys(PERMISSIONS);
};

// Get permissions grouped by category
export const getPermissionsByCategory = () => {
  const categories = {};
  
  for (const [permission, config] of Object.entries(PERMISSIONS)) {
    const category = permission.split('.')[0];
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push({
      permission,
      description: config.description,
      roles: config.roles,
    });
  }
  
  return categories;
};

export default {
  PERMISSIONS,
  getRolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionDescription,
  getAllPermissions,
  getPermissionsByCategory,
};
