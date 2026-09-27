import { Router } from 'express';
import db from '../db/database.js';
import { requirePermission } from '../middleware/rbac.js';
import { runSeed } from '../db/seed.js';

const router = Router();

// EXPORT full database workspace as JSON
router.get('/export', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  const projects = db.prepare('SELECT * FROM projects').all();
  const issues = db.prepare('SELECT * FROM issues').all();
  const comments = db.prepare('SELECT * FROM comments').all();
  const activities = db.prepare('SELECT * FROM activity_logs').all();
  const notes = db.prepare('SELECT * FROM notes').all();
  const noteShares = db.prepare('SELECT * FROM note_shares').all();

  const exportPayload = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      users,
      projects,
      issues,
      comments,
      activities,
      notes,
      note_shares: noteShares
    }
  };

  res.setHeader('Content-Disposition', `attachment; filename=tracker-backup-${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.json(exportPayload);
});

// RESET to demo seed data
router.post('/reset-seed', requirePermission('backup_restore'), (req, res) => {
  try {
    runSeed(true);
    res.json({ message: 'Workspace reset to default seed data successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// IMPORT database workspace from JSON
router.post('/import', requirePermission('backup_restore'), (req, res) => {
  const { data } = req.body;
  if (!data || !data.users || !data.projects || !data.issues) {
    return res.status(400).json({ error: 'Invalid backup format. Missing core entities.' });
  }

  try {
    db.exec(`
      DELETE FROM note_shares;
      DELETE FROM notes;
      DELETE FROM comments;
      DELETE FROM activity_logs;
      DELETE FROM issues;
      DELETE FROM projects;
      DELETE FROM users;
    `);

    // Insert users (preserves password hash/salt and active status, so restored accounts can still log in)
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, is_active, avatar_color, title, role, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of data.users) {
      insertUser.run(
        u.id, u.name, u.email,
        u.password_hash ?? null, u.salt ?? null,
        u.is_active !== undefined ? u.is_active : 1,
        u.avatar_color, u.title, u.role, u.bio, u.created_at
      );
    }

    // Insert projects
    const insertProject = db.prepare(`
      INSERT INTO projects (id, name, key, description, status, owner_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of data.projects) {
      insertProject.run(p.id, p.name, p.key, p.description, p.status, p.owner_id, p.created_at);
    }

    // Insert issues
    const insertIssue = db.prepare(`
      INSERT INTO issues (
        id, project_id, type, title, description, status, priority, severity,
        reproduction_steps, expected_behavior, actual_behavior, environment,
        assignee_id, reporter_id, due_date, archived_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const i of data.issues) {
      insertIssue.run(
        i.id, i.project_id, i.type, i.title, i.description, i.status, i.priority, i.severity,
        i.reproduction_steps, i.expected_behavior, i.actual_behavior, i.environment,
        i.assignee_id, i.reporter_id, i.due_date, i.archived_at ?? null, i.created_at, i.updated_at
      );
    }

    // Insert comments if any
    if (data.comments && Array.isArray(data.comments)) {
      const insertComment = db.prepare(`
        INSERT INTO comments (id, issue_id, user_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const c of data.comments) {
        insertComment.run(c.id, c.issue_id, c.user_id, c.content, c.created_at);
      }
    }

    // Insert notes if any
    if (data.notes && Array.isArray(data.notes)) {
      const insertNote = db.prepare(`
        INSERT INTO notes (id, owner_id, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const n of data.notes) {
        insertNote.run(n.id, n.owner_id, n.title, n.content, n.created_at, n.updated_at);
      }
    }

    // Insert note shares if any
    if (data.note_shares && Array.isArray(data.note_shares)) {
      const insertNoteShare = db.prepare(`
        INSERT INTO note_shares (id, note_id, user_id, permission, shared_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const s of data.note_shares) {
        insertNoteShare.run(s.id, s.note_id, s.user_id, s.permission, s.shared_at);
      }
    }

    res.json({ message: 'Workspace restored successfully!' });
  } catch (err) {
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

export default router;
