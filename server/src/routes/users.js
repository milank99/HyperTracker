import { Router } from 'express';
import db from '../db/database.js';
import { requirePermission, ROLE_PERMISSIONS } from '../middleware/rbac.js';
import { hashPassword } from '../utils/auth.js';

const router = Router();

// GET all users with their open task/bug counts
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.avatar_color, u.title, u.role, u.bio, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM issues WHERE assignee_id = u.id AND status NOT IN ('done', 'closed')) as active_issues_count,
      (SELECT COUNT(*) FROM issues WHERE assignee_id = u.id AND type = 'bug' AND status NOT IN ('done', 'closed')) as active_bugs_count
    FROM users u
    ORDER BY u.created_at ASC
  `).all();
  
  res.json(users);
});

// GET roles & permission matrix
router.get('/roles/matrix', (req, res) => {
  res.json({
    roles: Object.keys(ROLE_PERMISSIONS),
    matrix: ROLE_PERMISSIONS
  });
});

// GET single user profile
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, avatar_color, title, role, bio, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// CREATE new user profile
router.post('/', requirePermission('manage_users'), (req, res) => {
  const { name, email, password, avatar_color, title, role, bio } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  if (!ROLE_PERMISSIONS[role]) {
    return res.status(400).json({ error: `Invalid role: ${role}. Valid roles are: ${Object.keys(ROLE_PERMISSIONS).join(', ')}` });
  }

  // Check email uniqueness
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const avatar = avatar_color || '#6366f1';
  const { salt, hash } = hashPassword(password || 'password123');

  try {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, is_active, avatar_color, title, role, bio)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(id, name.trim(), email.trim(), hash, salt, avatar, title || 'Team Member', role, bio || '');

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
      VALUES (?, 'user', ?, ?, 'created', ?)
    `).run(`act_${Date.now()}`, id, req.currentUser.id, `Created team profile for ${name} as ${role}`);

    const newUser = db.prepare('SELECT id, name, email, avatar_color, title, role, bio, is_active, created_at FROM users WHERE id = ?').get(id);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE user profile
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, avatar_color, title, bio } = req.body;
  const currentUser = req.currentUser;

  // Only admin or the user themselves can update their profile details
  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    return res.status(403).json({ error: 'You can only update your own profile.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        avatar_color = COALESCE(?, avatar_color),
        title = COALESCE(?, title),
        bio = COALESCE(?, bio)
    WHERE id = ?
  `).run(name, email, avatar_color, title, bio, id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// UPDATE user role (Requires 'change_roles' permission)
router.put('/:id/role', requirePermission('change_roles'), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!ROLE_PERMISSIONS[role]) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);

  db.prepare(`
    INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
    VALUES (?, 'user', ?, ?, 'role_changed', ?)
  `).run(`act_${Date.now()}`, id, req.currentUser.id, `Updated role to ${role}`);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// RESET USER PASSWORD (Admin action)
router.put('/:id/reset-password', requirePermission('reset_passwords'), (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const passwordToSet = newPassword || 'password123';
  const { salt, hash } = hashPassword(passwordToSet);

  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, id);

  db.prepare(`
    INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
    VALUES (?, 'user', ?, ?, 'password_reset', ?)
  `).run(`act_${Date.now()}`, id, req.currentUser.id, `Reset password for user ${user.name}`);

  res.json({ message: `Password for ${user.name} was successfully reset.` });
});

// TOGGLE USER ACTIVE STATUS (Activate / Deactivate)
router.patch('/:id/toggle-status', requirePermission('manage_users'), (req, res) => {
  const { id } = req.params;

  if (req.currentUser.id === id) {
    return res.status(400).json({ error: 'Cannot deactivate your own active admin account.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newStatus = user.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, id);

  db.prepare(`
    INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
    VALUES (?, 'user', ?, ?, 'status_changed', ?)
  `).run(`act_${Date.now()}`, id, req.currentUser.id, `${newStatus === 1 ? 'Activated' : 'Deactivated'} account for ${user.name}`);

  res.json({ id, is_active: newStatus, message: `User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully.` });
});

// DELETE user profile
router.delete('/:id', requirePermission('manage_users'), (req, res) => {
  const { id } = req.params;

  if (req.currentUser.id === id) {
    return res.status(400).json({ error: 'Cannot delete your own active profile.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'User profile deleted successfully.' });
});

export default router;
