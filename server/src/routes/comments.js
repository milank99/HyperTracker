import { Router } from 'express';
import db from '../db/database.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// Add comment to an issue
router.post('/issues/:issueId/comments', requirePermission('comment'), (req, res) => {
  const { issueId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  const issue = db.prepare('SELECT id FROM issues WHERE id = ?').get(issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  const commentId = `cmt_${Date.now()}`;
  const userId = req.currentUser.id;

  try {
    db.prepare(`
      INSERT INTO comments (id, issue_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(commentId, issueId, userId, content.trim());

    db.prepare(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
      VALUES (?, 'comment', ?, ?, 'commented', ?)
    `).run(`act_${Date.now()}`, issueId, userId, `Commented on ${issueId}`);

    const newComment = db.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        u.avatar_color as author_avatar,
        u.role as author_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
router.delete('/comments/:id', (req, res) => {
  const { id } = req.params;
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found.' });
  }

  // Only comment author or admin can delete
  if (req.currentUser.role !== 'admin' && req.currentUser.id !== comment.user_id) {
    return res.status(403).json({ error: 'Unauthorized to delete this comment.' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  res.json({ message: 'Comment deleted.' });
});

export default router;
