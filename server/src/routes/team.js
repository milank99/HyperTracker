import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET Team Dashboard comprehensive statistics & roster
router.get('/stats', (req, res) => {
  // 1. Overall high-level counts
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  const totalIssues = db.prepare('SELECT COUNT(*) as count FROM issues').get().count;
  const activeIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status NOT IN ('done', 'closed')").get().count;
  const resolvedIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'done'").get().count;
  const openBugs = db.prepare("SELECT COUNT(*) as count FROM issues WHERE type = 'bug' AND status NOT IN ('done', 'closed')").get().count;
  const blockerBugs = db.prepare("SELECT COUNT(*) as count FROM issues WHERE type = 'bug' AND severity IN ('blocker', 'critical') AND status NOT IN ('done', 'closed')").get().count;

  // 2. Member workload matrix
  const users = db.prepare('SELECT id, name, email, avatar_color, title, role, bio FROM users ORDER BY name ASC').all();

  const memberWorkload = users.map(u => {
    const statusCounts = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM issues
      WHERE assignee_id = ?
      GROUP BY status
    `).all(u.id);

    const counts = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
      closed: 0
    };

    for (const row of statusCounts) {
      if (counts[row.status] !== undefined) {
        counts[row.status] = row.count;
      }
    }

    const bugsAssigned = db.prepare(`
      SELECT COUNT(*) as count
      FROM issues
      WHERE assignee_id = ? AND type = 'bug' AND status NOT IN ('done', 'closed')
    `).get(u.id).count;

    const criticalBugsAssigned = db.prepare(`
      SELECT COUNT(*) as count
      FROM issues
      WHERE assignee_id = ? AND type = 'bug' AND severity IN ('critical', 'blocker') AND status NOT IN ('done', 'closed')
    `).get(u.id).count;

    const totalActive = counts.todo + counts.in_progress + counts.in_review;

    return {
      ...u,
      workload: counts,
      totalActive,
      bugsAssigned,
      criticalBugsAssigned
    };
  });

  // 3. Recent Team Activity
  const activities = db.prepare(`
    SELECT 
      a.*,
      u.name as user_name,
      u.avatar_color as user_avatar,
      u.role as user_role
    FROM activity_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 25
  `).all();

  res.json({
    summary: {
      totalUsers,
      totalProjects,
      totalIssues,
      activeIssues,
      resolvedIssues,
      openBugs,
      blockerBugs
    },
    members: memberWorkload,
    activity: activities
  });
});

export default router;
