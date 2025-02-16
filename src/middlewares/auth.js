import { extractToken, verifyToken } from '../utils/jwt.js';
import { User, Role, Permission } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        include: [Permission]
      }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userPermissions = new Set();
      user.Roles.forEach(role => {
        role.Permissions.forEach(permission => {
          userPermissions.add(permission.name);
        });
      });

      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.has(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};
