import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/rbac.js';

const router = Router();

// All notes routes require a genuinely authenticated (non-guest) user,
// since notes are private/personal data gated by ownership and explicit sharing.
router.use(requireAuth);

// Resolve the current user's access level to a note: owner, shared editor, shared viewer, or none.
function resolveAccess(noteId, userId) {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
  if (!note) return { note: null, isOwner: false, permission: null };

  if (note.owner_id === userId) {
    return { note, isOwner: true, permission: 'edit' };
  }

  const share = db.prepare('SELECT permission FROM note_shares WHERE note_id = ? AND user_id = ?').get(noteId, userId);
  return { note, isOwner: false, permission: share ? share.permission : null };
}

// GET all notes owned by, or shared with, the current user
router.get('/', (req, res) => {
  const userId = req.currentUser.id;

  const notes = db.prepare(`
    SELECT
      n.id, n.title, n.owner_id, n.created_at, n.updated_at,
      o.name as owner_name,
      o.avatar_color as owner_avatar,
      CASE WHEN n.owner_id = ? THEN 1 ELSE 0 END as is_owner,
      CASE WHEN n.owner_id = ? THEN 'edit' ELSE ns.permission END as permission,
      (SELECT COUNT(*) FROM note_shares WHERE note_id = n.id) as share_count
    FROM notes n
    JOIN users o ON n.owner_id = o.id
    LEFT JOIN note_shares ns ON ns.note_id = n.id AND ns.user_id = ?
    WHERE n.owner_id = ? OR ns.user_id = ?
    ORDER BY n.updated_at DESC
  `).all(userId, userId, userId, userId, userId);

  res.json(notes);
});

// GET a single note (owner or shared users only)
router.get('/:id', (req, res) => {
  const { note, isOwner, permission } = resolveAccess(req.params.id, req.currentUser.id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }
  if (!isOwner && !permission) {
    return res.status(403).json({ error: 'You do not have access to this note.' });
  }

  const owner = db.prepare('SELECT id, name, avatar_color FROM users WHERE id = ?').get(note.owner_id);

  let shares = [];
  if (isOwner) {
    shares = db.prepare(`
      SELECT ns.user_id, ns.permission, ns.shared_at, u.name, u.email, u.avatar_color
      FROM note_shares ns
      JOIN users u ON ns.user_id = u.id
      WHERE ns.note_id = ?
      ORDER BY ns.shared_at ASC
    `).all(note.id);
  }

  res.json({ ...note, owner_name: owner?.name, owner_avatar: owner?.avatar_color, is_owner: isOwner, permission: isOwner ? 'edit' : permission, shares });
});

// CREATE a new note, owned by the current user
router.post('/', (req, res) => {
  const { title, content } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Note title is required.' });
  }

  const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const userId = req.currentUser.id;

  try {
    db.prepare(`
      INSERT INTO notes (id, owner_id, title, content)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, title.trim(), content || '');

    const created = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    res.status(201).json({ ...created, is_owner: true, permission: 'edit', shares: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a note (owner or users shared with 'edit' permission)
router.put('/:id', (req, res) => {
  const { title, content } = req.body;
  const { note, isOwner, permission } = resolveAccess(req.params.id, req.currentUser.id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }
  if (!isOwner && permission !== 'edit') {
    return res.status(403).json({ error: 'You do not have permission to edit this note.' });
  }

  db.prepare(`
    UPDATE notes
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(title ? title.trim() : null, content !== undefined ? content : null, note.id);

  const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(note.id);
  res.json(updated);
});

// DELETE a note (owner only)
router.delete('/:id', (req, res) => {
  const { note, isOwner } = resolveAccess(req.params.id, req.currentUser.id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }
  if (!isOwner) {
    return res.status(403).json({ error: 'Only the owner can delete this note.' });
  }

  db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
  res.json({ message: 'Note deleted.' });
});

// GET the share list for a note (owner only)
router.get('/:id/shares', (req, res) => {
  const { note, isOwner } = resolveAccess(req.params.id, req.currentUser.id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }
  if (!isOwner) {
    return res.status(403).json({ error: 'Only the owner can view sharing settings.' });
  }

  const shares = db.prepare(`
    SELECT ns.user_id, ns.permission, ns.shared_at, u.name, u.email, u.avatar_color
    FROM note_shares ns
    JOIN users u ON ns.user_id = u.id
    WHERE ns.note_id = ?
    ORDER BY ns.shared_at ASC
  `).all(note.id);

  res.json(shares);
});

// SHARE a note with another user (owner only)
router.post('/:id/shares', (req, res) => {
  const { userId, permission = 'view' } = req.body;
  const { note, isOwner } = resolveAccess(req.params.id, req.currentUser.id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }
  if (!isOwner) {
    return res.status(403).json({ error: 'Only the owner can share this note.' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'A target user is required.' });
  }
  if (userId === req.currentUser.id) {
    return res.status(400).json({ error: 'You already own this note.' });
  }
  if (!['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: "Permission must be 'view' or 'edit'." });
  }

  const targetUser = db.prepare('SELECT id, name, email, avatar_color FROM users WHERE id = ? AND is_active = 1').get(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found or inactive.' });
  }

  const shareId = `nsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    db.prepare(`
      INSERT INTO note_shares (id, note_id, user_id, permission)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(note_id, user_id) DO UPDATE SET permission = excluded.permission
    `).run(shareId, note.id, userId, permission);

    res.status(201).json({ user_id: targetUser.id, name: targetUser.name, email: targetUser.email, avatar_color: targetUser.avatar_color, permission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REVOKE a user's access to a note (owner only)
router.delete('/:id/shares/:userId', (req, res) => {
  const { note, isOwner } = resolveAccess(req.params.id, req.currentUser.id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }
  if (!isOwner) {
    return res.status(403).json({ error: 'Only the owner can manage sharing for this note.' });
  }

  db.prepare('DELETE FROM note_shares WHERE note_id = ? AND user_id = ?').run(note.id, req.params.userId);
  res.json({ message: 'Access revoked.' });
});

export default router;
