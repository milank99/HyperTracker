import { Router } from 'express';
import db from '../db/database.js';
import { hashPassword, verifyPassword, createSession, destroySession } from '../utils/auth.js';

const router = Router();

// LOGIN
router.post('/login', (req, res) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)').get(identifier, identifier);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  if (user.is_active === 0) {
    return res.status(403).json({ error: 'This user account has been deactivated. Please contact an Admin.' });
  }

  // Verify password
  const isValid = verifyPassword(password, user.salt, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Create session
  const token = createSession(user);

  // Return user without password fields
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_color: user.avatar_color,
    title: user.title,
    role: user.role,
    bio: user.bio,
    created_at: user.created_at
  };

  res.json({
    token,
    user: safeUser
  });
});

// LOGOUT
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token'];
  if (token) {
    destroySession(token);
  }
  res.json({ message: 'Logged out successfully.' });
});

// GET CURRENT USER PROFILE (/me)
router.get('/me', (req, res) => {
  if (!req.currentUser || req.currentUser.id === 'usr_guest') {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const user = db.prepare('SELECT id, name, email, avatar_color, title, role, bio, is_active, created_at FROM users WHERE id = ?').get(req.currentUser.id);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  res.json(user);
});

// UPDATE OWN PROFILE
router.put('/profile', (req, res) => {
  if (!req.currentUser || req.currentUser.id === 'usr_guest') {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const { name, title, avatar_color, bio } = req.body;
  const userId = req.currentUser.id;

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        title = COALESCE(?, title),
        avatar_color = COALESCE(?, avatar_color),
        bio = COALESCE(?, bio)
    WHERE id = ?
  `).run(name, title, avatar_color, bio, userId);

  const updated = db.prepare('SELECT id, name, email, avatar_color, title, role, bio, created_at FROM users WHERE id = ?').get(userId);
  res.json(updated);
});

// CHANGE OWN PASSWORD
router.put('/change-password', (req, res) => {
  if (!req.currentUser || req.currentUser.id === 'usr_guest') {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.currentUser.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const isValid = verifyPassword(currentPassword, user.salt, user.password_hash);
  if (!isValid) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const { salt, hash } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);

  res.json({ message: 'Password changed successfully.' });
});

export default router;
