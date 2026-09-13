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

  const exportPayload = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      users,
      projects,
      issues,
      comments,
      activities
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
      DELETE FROM comments;
      DELETE FROM activity_logs;
      DELETE FROM issues;
      DELETE FROM projects;
      DELETE FROM users;
    `);

    // Insert users
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, avatar_color, title, role, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of data.users) {
      insertUser.run(u.id, u.name, u.email, u.avatar_color, u.title, u.role, u.bio, u.created_at);
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
        assignee_id, reporter_id, due_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const i of data.issues) {
      insertIssue.run(
        i.id, i.project_id, i.type, i.title, i.description, i.status, i.priority, i.severity,
        i.reproduction_steps, i.expected_behavior, i.actual_behavior, i.environment,
        i.assignee_id, i.reporter_id, i.due_date, i.created_at, i.updated_at
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

    res.json({ message: 'Workspace restored successfully!' });
  } catch (err) {
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

export default router;
