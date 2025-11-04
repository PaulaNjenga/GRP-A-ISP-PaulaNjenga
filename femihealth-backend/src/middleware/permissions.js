import { hasPermission, hasAllPermissions, hasAnyPermission } from '../config/permissions.js';

// Check if user has a specific permission
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permission}`,
        requiredPermission: permission,
        userRole: userRole,
      });
    }

    next();
  };
};

// Check if user has ALL specified permissions (AND logic)
export const checkAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;
    
    if (!hasAllPermissions(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You do not have all required permissions.',
        requiredPermissions: permissions,
        userRole: userRole,
      });
    }

    next();
  };
};

// Check if user has ANY of the specified permissions (OR logic)
export const checkAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;
    
    if (!hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You need at least one of the required permissions.',
        requiredPermissions: permissions,
        userRole: userRole,
      });
    }

    next();
  };
};

// Check resource ownership (for "own" permissions)
export const checkOwnership = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource from request (could be in params, body, or loaded resource)
    const resource = req.resource || req.body;
    
    if (!resource) {
      return res.status(400).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Check if user owns the resource
    const resourceUserId = resource[resourceUserIdField]?.toString() || resource[resourceUserIdField];
    const currentUserId = req.user._id.toString();

    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

// Middleware to load resource and attach to request
export const loadResource = (Model, idParam = 'id', attachAs = 'resource') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `${idParam} parameter is required`,
        });
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      req[attachAs] = resource;
      next();
    } catch (error) {
      console.error('Error loading resource:', error);
      res.status(500).json({
        success: false,
        message: 'Error loading resource',
        error: error.message,
      });
    }
  };
};

// Combined permission and ownership check
export const checkPermissionAndOwnership = (permission, resourceUserIdField = 'user') => {
  return [
    checkPermission(permission),
    checkOwnership(resourceUserIdField),
  ];
};

export default {
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
  checkOwnership,
  loadResource,
  checkPermissionAndOwnership,
};
