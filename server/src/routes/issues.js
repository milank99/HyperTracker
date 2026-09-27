import { Router } from 'express';
import db from '../db/database.js';
import { requirePermission, hasPermission } from '../middleware/rbac.js';

const router = Router();

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Registered before '/:id' so literal "/bulk..." paths aren't swallowed as an issue id.

// BULK UPDATE status / priority / assignee across multiple tickets at once
router.patch('/bulk', requirePermission('edit_issue'), (req, res) => {
  const { ids, status, priority, assigneeId } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide a non-empty array of ticket ids.' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status: ${status}` });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority: ${priority}` });
  }
  if (status === undefined && priority === undefined && assigneeId === undefined) {
    return res.status(400).json({ error: 'Provide at least one field to update (status, priority, or assigneeId).' });
  }

  let updatedCount = 0;
  for (const id of ids) {
    const existing = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!existing) continue;

    const nextStatus = status !== undefined ? status : existing.status;
    const nextPriority = priority !== undefined ? priority : existing.priority;
    const nextAssignee = assigneeId !== undefined ? (assigneeId || null) : existing.assignee_id;

    db.prepare(`
      UPDATE issues
      SET status = ?, priority = ?, assignee_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(nextStatus, nextPriority, nextAssignee, id);

    const changes = [];
    if (status !== undefined && status !== existing.status) changes.push(`status to ${status}`);
    if (priority !== undefined && priority !== existing.priority) changes.push(`priority to ${priority}`);
    if (assigneeId !== undefined && (assigneeId || null) !== existing.assignee_id) changes.push('assignee');
    if (changes.length > 0) {
      db.prepare(`
        INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
        VALUES (?, 'issue', ?, ?, 'bulk_updated', ?)
      `).run(`act_${Date.now()}_${updatedCount}`, id, req.currentUser.id, `Bulk updated: ${changes.join(', ')}`);
    }
    updatedCount++;
  }

  res.json({ message: `${updatedCount} ticket(s) updated.`, updatedCount });
});

// BULK ARCHIVE / UNARCHIVE
router.patch('/bulk/archive', requirePermission('delete_issue'), (req, res) => {
  const { ids, archived } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide a non-empty array of ticket ids.' });
  }

  let updatedCount = 0;
  for (const id of ids) {
    const existing = db.prepare('SELECT id, archived_at FROM issues WHERE id = ?').get(id);
    if (!existing) continue;

    const alreadyArchived = !!existing.archived_at;
    if (archived && alreadyArchived) continue;
    if (!archived && !alreadyArchived) continue;

    if (archived) {
      db.prepare(`UPDATE issues SET archived_at = datetime('now') WHERE id = ?`).run(id);
    } else {
      db.prepare(`UPDATE issues SET archived_at = NULL WHERE id = ?`).run(id);
    }

    db.prepare(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
      VALUES (?, 'issue', ?, ?, ?, ?)
    `).run(
      `act_${Date.now()}_${updatedCount}`, id, req.currentUser.id,
      archived ? 'archived' : 'unarchived',
      archived ? `Archived ${id} (bulk)` : `Unarchived ${id} (bulk)`
    );
    updatedCount++;
  }

  res.json({ message: `${updatedCount} ticket(s) ${archived ? 'archived' : 'unarchived'}.`, updatedCount });
});

// BULK DELETE
router.delete('/bulk', requirePermission('delete_issue'), (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide a non-empty array of ticket ids.' });
  }

  let deletedCount = 0;
  for (const id of ids) {
    const result = db.prepare('DELETE FROM issues WHERE id = ?').run(id);
    if (result.changes > 0) deletedCount++;
  }

  res.json({ message: `${deletedCount} ticket(s) deleted.`, deletedCount });
});

// GET all issues with rich filters
router.get('/', (req, res) => {
  const { projectId, type, status, priority, severity, assigneeId, reporterId, dueFilter, search, archived } = req.query;

  let query = `
    SELECT 
      i.*,
      p.name as project_name,
      p.key as project_key,
      assignee.name as assignee_name,
      assignee.avatar_color as assignee_avatar,
      assignee.title as assignee_title,
      reporter.name as reporter_name,
      reporter.avatar_color as reporter_avatar,
      (SELECT COUNT(*) FROM comments WHERE issue_id = i.id) as comment_count
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    LEFT JOIN users assignee ON i.assignee_id = assignee.id
    LEFT JOIN users reporter ON i.reporter_id = reporter.id
    WHERE 1=1
  `;

  const params = [];

  if (projectId) {
    query += ` AND i.project_id = ?`;
    params.push(projectId);
  }
  if (type) {
    query += ` AND i.type = ?`;
    params.push(type);
  }
  if (status) {
    query += ` AND i.status = ?`;
    params.push(status);
  }
  if (priority) {
    query += ` AND i.priority = ?`;
    params.push(priority);
  }
  if (severity) {
    query += ` AND i.severity = ?`;
    params.push(severity);
  }
  if (assigneeId === 'unassigned') {
    query += ` AND i.assignee_id IS NULL`;
  } else if (assigneeId) {
    query += ` AND i.assignee_id = ?`;
    params.push(assigneeId);
  }
  if (reporterId) {
    query += ` AND i.reporter_id = ?`;
    params.push(reporterId);
  }
  if (dueFilter === 'overdue') {
    query += ` AND i.due_date IS NOT NULL AND date(i.due_date) < date('now') AND i.status NOT IN ('done', 'closed')`;
  } else if (dueFilter === 'this_week') {
    query += ` AND i.due_date IS NOT NULL AND date(i.due_date) BETWEEN date('now') AND date('now', '+7 days')`;
  } else if (dueFilter === 'no_date') {
    query += ` AND i.due_date IS NULL`;
  }
  if (search) {
    query += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.id LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  // Archived tickets are hidden by default so they don't clutter active workflows.
  if (archived === 'only') {
    query += ` AND i.archived_at IS NOT NULL`;
  } else if (archived !== 'all') {
    query += ` AND i.archived_at IS NULL`;
  }

  query += ` ORDER BY
    CASE i.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END ASC,
    i.created_at DESC
  `;

  const issues = db.prepare(query).all(...params);
  res.json(issues);
});

// GET single issue by ID with comments
router.get('/:id', (req, res) => {
  const issue = db.prepare(`
    SELECT 
      i.*,
      p.name as project_name,
      p.key as project_key,
      assignee.name as assignee_name,
      assignee.avatar_color as assignee_avatar,
      assignee.title as assignee_title,
      reporter.name as reporter_name,
      reporter.avatar_color as reporter_avatar
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    LEFT JOIN users assignee ON i.assignee_id = assignee.id
    LEFT JOIN users reporter ON i.reporter_id = reporter.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const comments = db.prepare(`
    SELECT
      c.*,
      u.name as author_name,
      u.avatar_color as author_avatar,
      u.role as author_role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.issue_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  const activity = db.prepare(`
    SELECT
      a.*,
      u.name as user_name,
      u.avatar_color as user_avatar
    FROM activity_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.entity_type = 'issue' AND a.entity_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  res.json({ ...issue, comments, activity });
});

// CREATE new issue or bug
router.post('/', (req, res) => {
  const user = req.currentUser;
  const {
    project_id,
    type,
    title,
    description,
    status = 'backlog',
    priority = 'medium',
    severity,
    reproduction_steps,
    expected_behavior,
    actual_behavior,
    environment,
    assignee_id,
    due_date
  } = req.body;

  // Permission validation
  if (type === 'bug') {
    if (!hasPermission(user.role, 'report_bug') && !hasPermission(user.role, 'create_issue')) {
      return res.status(403).json({ error: "Your role is not authorized to report bugs." });
    }
  } else {
    if (!hasPermission(user.role, 'create_issue')) {
      return res.status(403).json({ error: "Your role is not authorized to create issues." });
    }
  }

  if (!project_id || !title || !type) {
    return res.status(400).json({ error: 'Project, Title, and Issue Type are required.' });
  }

  const project = db.prepare('SELECT key FROM projects WHERE id = ?').get(project_id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  // Generate unique sequential ticket key (e.g. MTT-107)
  const prefix = `${project.key}-`;
  const existingIssues = db.prepare('SELECT id FROM issues WHERE project_id = ?').all(project_id);
  let maxNum = 100;
  for (const row of existingIssues) {
    if (row.id && row.id.startsWith(prefix)) {
      const num = parseInt(row.id.slice(prefix.length), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let candidateNum = maxNum + 1;
  let issueId = `${prefix}${candidateNum}`;
  while (db.prepare('SELECT 1 FROM issues WHERE id = ?').get(issueId)) {
    candidateNum++;
    issueId = `${prefix}${candidateNum}`;
  }

  try {
    db.prepare(`
      INSERT INTO issues (
        id, project_id, type, title, description, status, priority, severity,
        reproduction_steps, expected_behavior, actual_behavior, environment,
        assignee_id, reporter_id, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      issueId,
      project_id,
      type,
      title,
      description || '',
      status,
      priority,
      type === 'bug' ? (severity || 'minor') : null,
      reproduction_steps || null,
      expected_behavior || null,
      actual_behavior || null,
      environment || null,
      assignee_id || null,
      user.id,
      due_date || null
    );

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
      VALUES (?, 'issue', ?, ?, 'created', ?)
    `).run(
      `act_${Date.now()}`,
      issueId,
      user.id,
      `Created ${type} [${issueId}] "${title}"`
    );

    const created = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE issue
router.put('/:id', requirePermission('edit_issue'), (req, res) => {
  const { id } = req.params;
  // node:sqlite rejects `undefined` bind parameters (unlike some other SQLite drivers),
  // so default every optional field to null - COALESCE below then leaves it unchanged.
  const {
    title = null,
    description = null,
    status = null,
    priority = null,
    severity = null,
    reproduction_steps = null,
    expected_behavior = null,
    actual_behavior = null,
    environment = null,
    assignee_id,
    due_date = null
  } = req.body;

  const existing = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Track which fields actually changed, for a human-readable activity log entry
  const resolvedAssigneeId = assignee_id !== undefined ? assignee_id : existing.assignee_id;
  const fieldChanges = [];
  if (title !== undefined && title !== null && title !== existing.title) fieldChanges.push('title');
  if (status !== undefined && status !== null && status !== existing.status) fieldChanges.push('status');
  if (priority !== undefined && priority !== null && priority !== existing.priority) fieldChanges.push('priority');
  if (severity !== undefined && severity !== null && severity !== existing.severity) fieldChanges.push('severity');
  if (resolvedAssigneeId !== existing.assignee_id) fieldChanges.push('assignee');
  if (due_date !== undefined && due_date !== null && due_date !== existing.due_date) fieldChanges.push('due date');
  if (description !== undefined && description !== null && description !== existing.description) fieldChanges.push('description');

  db.prepare(`
    UPDATE issues
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        severity = COALESCE(?, severity),
        reproduction_steps = COALESCE(?, reproduction_steps),
        expected_behavior = COALESCE(?, expected_behavior),
        actual_behavior = COALESCE(?, actual_behavior),
        environment = COALESCE(?, environment),
        assignee_id = ?,
        due_date = COALESCE(?, due_date),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title,
    description,
    status,
    priority,
    severity,
    reproduction_steps,
    expected_behavior,
    actual_behavior,
    environment,
    resolvedAssigneeId,
    due_date,
    id
  );

  if (fieldChanges.length > 0) {
    db.prepare(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
      VALUES (?, 'issue', ?, ?, 'updated', ?)
    `).run(`act_${Date.now()}`, id, req.currentUser.id, `Updated ${fieldChanges.join(', ')}`);
  }

  const updated = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  res.json(updated);
});

// PATCH move status (Kanban column transition)
router.patch('/:id/status', requirePermission('move_issue'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status: ${status}` });
  }

  const existing = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  db.prepare(`
    UPDATE issues
    SET status = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, id);

  db.prepare(`
    INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
    VALUES (?, 'issue', ?, ?, 'updated_status', ?)
  `).run(
    `act_${Date.now()}`,
    id,
    req.currentUser.id,
    `Moved ${id} from ${existing.status} to ${status}`
  );

  res.json({ id, status, previousStatus: existing.status });
});

// ARCHIVE issue (soft-hide from active workflows without deleting it)
router.patch('/:id/archive', requirePermission('delete_issue'), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  if (existing.archived_at) {
    return res.status(400).json({ error: 'Issue is already archived.' });
  }

  db.prepare(`UPDATE issues SET archived_at = datetime('now') WHERE id = ?`).run(id);

  db.prepare(`
    INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
    VALUES (?, 'issue', ?, ?, 'archived', ?)
  `).run(`act_${Date.now()}`, id, req.currentUser.id, `Archived ${id}`);

  const updated = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  res.json(updated);
});

// UNARCHIVE issue (restore back into active workflows)
router.patch('/:id/unarchive', requirePermission('delete_issue'), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  if (!existing.archived_at) {
    return res.status(400).json({ error: 'Issue is not archived.' });
  }

  db.prepare(`UPDATE issues SET archived_at = NULL WHERE id = ?`).run(id);

  db.prepare(`
    INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
    VALUES (?, 'issue', ?, ?, 'unarchived', ?)
  `).run(`act_${Date.now()}`, id, req.currentUser.id, `Unarchived ${id}`);

  const updated = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE issue
router.delete('/:id', requirePermission('delete_issue'), (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM issues WHERE id = ?').run(id);
  res.json({ message: 'Issue deleted.' });
});

export default router;
