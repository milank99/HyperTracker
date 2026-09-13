// Role-Based Access Control (RBAC) definitions and middleware
import db from '../db/database.js';
import { getSession } from '../utils/auth.js';

export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'change_roles',
    'admin_console',
    'reset_passwords',
    'create_project',
    'edit_project',
    'delete_project',
    'create_issue',
    'edit_issue',
    'delete_issue',
    'move_issue',
    'assign_issue',
    'verify_bug',
    'comment',
    'backup_restore',
    'view_all'
  ],
  pm: [
    'create_project',
    'edit_project',
    'create_issue',
    'edit_issue',
    'delete_issue',
    'move_issue',
    'assign_issue',
    'comment',
    'view_all'
  ],
  developer: [
    'create_issue',
    'edit_issue',
    'move_issue',
    'comment',
    'view_all'
  ],
  qa: [
    'create_issue',
    'report_bug',
    'verify_bug',
    'move_issue',
    'edit_issue',
    'comment',
    'view_all'
  ],
  viewer: [
    'view_all'
  ]
};

export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// Middleware to resolve active user from Authorization header, x-auth-token, x-user-id or fallback
export function resolveUser(req, res, next) {
  // 1. Check Bearer Token or x-auth-token
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.substring(7)
    : req.headers['x-auth-token'];

  if (token) {
    const session = getSession(token);
    if (session) {
      const user = db.prepare('SELECT id, name, email, avatar_color, title, role, bio, is_active, created_at FROM users WHERE id = ?').get(session.userId);
      if (user && user.is_active !== 0) {
        req.currentUser = user;
        return next();
      }
    }
  }

  // 2. Backward compatibility: x-user-id header
  const userId = req.headers['x-user-id'] || req.query.currentUserId;
  if (userId) {
    const user = db.prepare('SELECT id, name, email, avatar_color, title, role, bio, is_active, created_at FROM users WHERE id = ?').get(userId);
    if (user) {
      req.currentUser = user;
      return next();
    }
  }

  // 3. Fallback to guest observer
  req.currentUser = {
    id: 'usr_guest',
    name: 'Guest Observer',
    role: 'viewer'
  };
  next();
}

// Middleware generator to enforce a specific permission
export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.currentUser;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: No active profile detected.' });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({
        error: `Forbidden: Role '${user.role}' lacks '${permission}' permission.`,
        requiredPermission: permission,
        currentRole: user.role
      });
    }

    next();
  };
}
