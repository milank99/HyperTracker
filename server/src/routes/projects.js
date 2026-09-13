import { Router } from 'express';
import db from '../db/database.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// GET all projects with counts
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT 
      p.*,
      u.name as owner_name,
      u.avatar_color as owner_avatar,
      (SELECT COUNT(*) FROM issues WHERE project_id = p.id) as total_issues,
      (SELECT COUNT(*) FROM issues WHERE project_id = p.id AND status = 'done') as done_issues,
      (SELECT COUNT(*) FROM issues WHERE project_id = p.id AND type = 'bug' AND status NOT IN ('done', 'closed')) as open_bugs,
      (SELECT COUNT(*) FROM issues WHERE project_id = p.id AND type = 'bug' AND severity IN ('critical', 'blocker') AND status NOT IN ('done', 'closed')) as blocker_bugs
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    ORDER BY p.created_at ASC
  `).all();

  res.json(projects);
});

// GET single project
router.get('/:id', (req, res) => {
  const project = db.prepare(`
    SELECT 
      p.*,
      u.name as owner_name,
      u.avatar_color as owner_avatar
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json(project);
});

// CREATE project
router.post('/', requirePermission('create_project'), (req, res) => {
  const { name, key, description, status, owner_id } = req.body;

  if (!name || !key) {
    return res.status(400).json({ error: 'Project name and key (prefix) are required.' });
  }

  const cleanKey = key.trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM projects WHERE key = ?').get(cleanKey);
  if (existing) {
    return res.status(400).json({ error: `Project key '${cleanKey}' is already in use.` });
  }

  const id = `proj_${Date.now()}`;
  const owner = owner_id || req.currentUser.id;

  try {
    db.prepare(`
      INSERT INTO projects (id, name, key, description, status, owner_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, cleanKey, description || '', status || 'active', owner);

    db.prepare(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
      VALUES (?, 'project', ?, ?, 'created', ?)
    `).run(`act_${Date.now()}`, id, req.currentUser.id, `Created project ${name} [${cleanKey}]`);

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE project
router.put('/:id', requirePermission('edit_project'), (req, res) => {
  const { id } = req.params;
  const { name, description, status, owner_id } = req.body;

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  db.prepare(`
    UPDATE projects
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        owner_id = COALESCE(?, owner_id)
    WHERE id = ?
  `).run(name, description, status, owner_id, id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE project
router.delete('/:id', requirePermission('delete_project'), (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ message: 'Project and all associated issues deleted.' });
});

export default router;
