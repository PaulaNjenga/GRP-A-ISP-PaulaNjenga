const { USER_ROLES, PERMISSIONS } = require('../models/User');

// Role-Based Access Control Middleware
class RBACMiddleware {
  // Check if user has specific permission
  static requirePermission(permission) {
    return (req, res, next) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        if (!user.hasPermission(permission)) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            required: permission,
            userRole: user.role
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Permission check failed',
          error: error.message
        });
      }
    };
  }

  // Check if user has specific role
  static requireRole(role) {
    return (req, res, next) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        if (!user.hasRole(role)) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient role privileges',
            required: role,
            userRole: user.role
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Role check failed',
          error: error.message
        });
      }
    };
  }

  // Check if user has any of the specified roles
  static requireAnyRole(roles) {
    return (req, res, next) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        const hasRole = roles.some(role => user.hasRole(role));
        
        if (!hasRole) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient role privileges',
            required: roles,
            userRole: user.role
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Role check failed',
          error: error.message
        });
      }
    };
  }

  // Check if user can access specific resource (own data or has permission)
  static requireResourceAccess(permission, resourceUserIdParam = 'userId') {
    return (req, res, next) => {
      try {
        const user = req.user;
        const resourceUserId = parseInt(req.params[resourceUserIdParam]);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Allow access if it's user's own data
        if (user.id === resourceUserId) {
          return next();
        }

        // Check if user has permission to access other users' data
        if (!user.hasPermission(permission)) {
          return res.status(403).json({
            success: false,
            message: 'Cannot access other users\' data',
            required: permission,
            userRole: user.role
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Resource access check failed',
          error: error.message
        });
      }
    };
  }

  // Doctor verification middleware
  static requireVerifiedDoctor() {
    return (req, res, next) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        if (!user.isDoctor()) {
          return res.status(403).json({
            success: false,
            message: 'Doctor role required'
          });
        }

        if (user.verificationStatus !== 'verified') {
          return res.status(403).json({
            success: false,
            message: 'Doctor verification required',
            verificationStatus: user.verificationStatus
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Doctor verification check failed',
          error: error.message
        });
      }
    };
  }

  // Admin only middleware
  static requireAdmin() {
    return this.requireRole(USER_ROLES.ADMIN);
  }

  // Patient or Doctor middleware
  static requirePatientOrDoctor() {
    return this.requireAnyRole([USER_ROLES.PATIENT, USER_ROLES.DOCTOR]);
  }

  // Data anonymization middleware for responses
  static anonymizeResponse(level = 'safe') {
    return (req, res, next) => {
      const originalJson = res.json;
      
      res.json = function(data) {
        try {
          const user = req.user;
          
          // Apply anonymization based on user role and level
          if (data && typeof data === 'object') {
            data = RBACMiddleware.applyAnonymization(data, user, level);
          }
          
          return originalJson.call(this, data);
        } catch (error) {
          console.error('Anonymization error:', error);
          return originalJson.call(this, data);
        }
      };
      
      next();
    };
  }

  static applyAnonymization(data, user, level) {
    if (!data || typeof data !== 'object') return data;

    // If user is admin, return full data
    if (user && user.isAdmin() && level !== 'force') {
      return data;
    }

    // Apply anonymization to arrays
    if (Array.isArray(data)) {
      return data.map(item => this.applyAnonymization(item, user, level));
    }

    // Apply anonymization to objects with toSafeJSON method
    if (data.toSafeJSON && typeof data.toSafeJSON === 'function') {
      return data.toSafeJSON();
    }

    // Apply anonymization to objects with toAnonymized method
    if (level === 'anonymous' && data.toAnonymized && typeof data.toAnonymized === 'function') {
      return data.toAnonymized();
    }

    return data;
  }

  // Audit logging middleware
  static auditLog(action) {
    return (req, res, next) => {
      const user = req.user;
      const timestamp = new Date().toISOString();
      
      // Log the action (in production, send to proper logging service)
      console.log(`[AUDIT] ${timestamp} - User: ${user ? user.anonymousId : 'anonymous'} - Action: ${action} - IP: ${req.ip} - UserAgent: ${req.get('User-Agent')}`);
      
      next();
    };
  }
}

// Convenience functions for common permission checks
const requireSelfPredict = () => RBACMiddleware.requirePermission(PERMISSIONS.SELF_PREDICT);
const requireDiagnose = () => RBACMiddleware.requirePermission(PERMISSIONS.DIAGNOSE);
const requireViewPatientData = () => RBACMiddleware.requirePermission(PERMISSIONS.VIEW_PATIENT_DATA);
const requireManageUsers = () => RBACMiddleware.requirePermission(PERMISSIONS.MANAGE_USERS);
const requireViewSystemHealth = () => RBACMiddleware.requirePermission(PERMISSIONS.VIEW_SYSTEM_HEALTH);

module.exports = {
  RBACMiddleware,
  requireSelfPredict,
  requireDiagnose,
  requireViewPatientData,
  requireManageUsers,
  requireViewSystemHealth
};
