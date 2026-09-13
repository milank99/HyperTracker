import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Flame, 
  CheckCircle2, 
  Activity, 
  Clock, 
  Briefcase,
  AlertTriangle,
  Mail,
  Edit2
} from 'lucide-react';

export default function TeamDashboard({ onOpenNewProfile }) {
  const { currentUser, can, showToast } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleMatrix, setRoleMatrix] = useState(null);

  const fetchTeamStats = async () => {
    try {
      const res = await fetch('/api/team/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch team stats:', err);
    }
  };

  const fetchRoleMatrix = async () => {
    try {
      const res = await fetch('/api/users/roles/matrix');
      const data = await res.json();
      setRoleMatrix(data);
    } catch (err) {
      console.error('Failed to fetch role matrix:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTeamStats(), fetchRoleMatrix()]).finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update role');
      }

      showToast(`Role updated to ${newRole.toUpperCase()}`, 'success');
      fetchTeamStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        Loading team analytics...
      </div>
    );
  }

  const { summary, members, activity } = stats;

  const permissionsList = [
    { key: 'manage_users', label: 'Create/Manage Team Profiles' },
    { key: 'change_roles', label: 'Assign & Change Roles' },
    { key: 'create_project', label: 'Create Projects' },
    { key: 'delete_project', label: 'Delete Projects' },
    { key: 'create_issue', label: 'Create Tasks & Stories' },
    { key: 'report_bug', label: 'File & Report Bugs' },
    { key: 'verify_bug', label: 'Verify & Sign Off Bug Fixes' },
    { key: 'move_issue', label: 'Move Kanban Columns' },
    { key: 'edit_issue', label: 'Edit Ticket Details & Priority' },
    { key: 'comment', label: 'Add Comments & Notes' },
    { key: 'backup_restore', label: 'Export / Restore Database' }
  ];

  return (
    <div className="team-dashboard">
      {/* 1. Header & Summary Stats Cards */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Team Workload & Access Control
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time capacity distribution, member profiles, and role permission enforcement.
          </p>
        </div>

        {can('manage_users') && (
          <button className="btn btn-primary" onClick={onOpenNewProfile}>
            <UserPlus size={16} />
            <span>Create Team Profile</span>
          </button>
        )}
      </div>

      <div className="team-stats-grid">
        <div className="stat-card primary">
          <span className="stat-label">Team Size</span>
          <span className="stat-value">{summary.totalUsers}</span>
          <span className="stat-sub">Active members</span>
        </div>
        <div className="stat-card cyan">
          <span className="stat-label">In-Flight Tasks</span>
          <span className="stat-value">{summary.activeIssues}</span>
          <span className="stat-sub">Across {summary.totalProjects} projects</span>
        </div>
        <div className="stat-card emerald">
          <span className="stat-label">Resolved Tickets</span>
          <span className="stat-value">{summary.resolvedIssues}</span>
          <span className="stat-sub">Completed velocity</span>
        </div>
        <div className="stat-card rose">
          <span className="stat-label">Active Bugs</span>
          <span className="stat-value">{summary.openBugs}</span>
          <span className="stat-sub">{summary.blockerBugs} critical / blockers</span>
        </div>
      </div>

      {/* 2. Workload & Allocation Distribution */}
      <div>
        <div className="section-header">
          <div className="section-title">
            <Briefcase size={20} color="var(--primary)" />
            <span>Workload Allocation Matrix</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-todo)' }} /> To Do
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-inprogress)' }} /> In Progress
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-review)' }} /> In Review
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-done)' }} /> Done
            </span>
          </div>
        </div>

        <div className="workload-matrix-card">
          {members.map(member => {
            const total = member.workload.todo + member.workload.in_progress + member.workload.in_review + member.workload.done;
            const pct = (val) => (total > 0 ? (val / total) * 100 : 0);

            return (
              <div key={member.id} className="member-workload-row">
                {/* Member Info */}
                <div className="member-identity">
                  <div 
                    className="user-avatar" 
                    style={{ backgroundColor: member.avatar_color || '#6366f1', width: '36px', height: '36px', fontSize: '13px' }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="member-details">
                    <span className="member-name">{member.name}</span>
                    <span className="member-title">{member.title || member.email}</span>
                  </div>
                </div>

                {/* Stacked Workload Bar */}
                <div>
                  {total === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No tickets assigned currently
                    </div>
                  ) : (
                    <div className="stacked-workload-bar">
                      {member.workload.todo > 0 && (
                        <div 
                          className="workload-segment todo" 
                          style={{ width: `${pct(member.workload.todo)}%` }}
                          title={`To Do: ${member.workload.todo}`}
                        >
                          {member.workload.todo}
                        </div>
                      )}
                      {member.workload.in_progress > 0 && (
                        <div 
                          className="workload-segment in_progress" 
                          style={{ width: `${pct(member.workload.in_progress)}%` }}
                          title={`In Progress: ${member.workload.in_progress}`}
                        >
                          {member.workload.in_progress}
                        </div>
                      )}
                      {member.workload.in_review > 0 && (
                        <div 
                          className="workload-segment in_review" 
                          style={{ width: `${pct(member.workload.in_review)}%` }}
                          title={`In Review: ${member.workload.in_review}`}
                        >
                          {member.workload.in_review}
                        </div>
                      )}
                      {member.workload.done > 0 && (
                        <div 
                          className="workload-segment done" 
                          style={{ width: `${pct(member.workload.done)}%` }}
                          title={`Done: ${member.workload.done}`}
                        >
                          {member.workload.done}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="workload-badges-group">
                  <span className={`role-badge role-${member.role}`}>
                    {member.role}
                  </span>
                  {member.criticalBugsAssigned > 0 && (
                    <span 
                      className="badge severity-blocker" 
                      title={`${member.criticalBugsAssigned} Critical/Blocker bug(s) assigned`}
                    >
                      <Flame size={10} style={{ marginRight: '2px' }} />
                      {member.criticalBugsAssigned}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {member.totalActive} active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Team Profiles Roster Grid */}
      <div>
        <div className="section-header">
          <div className="section-title">
            <Users size={20} color="var(--accent-cyan)" />
            <span>Team Directory & Profiles</span>
          </div>
        </div>

        <div className="roster-grid">
          {members.map(member => (
            <div key={member.id} className="roster-card">
              <div className="roster-card-top">
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div 
                    className="user-avatar"
                    style={{ backgroundColor: member.avatar_color, width: '42px', height: '42px', fontSize: '16px' }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{member.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Mail size={11} />
                      {member.email}
                    </div>
                  </div>
                </div>

                {/* Role Switcher (if Admin) */}
                {can('change_roles') && currentUser?.id !== member.id ? (
                  <select
                    className="select-input"
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    style={{ fontSize: '11px', padding: '3px 6px', fontWeight: 600 }}
                  >
                    <option value="admin">Admin</option>
                    <option value="pm">PM</option>
                    <option value="developer">Developer</option>
                    <option value="qa">QA</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={`role-badge role-${member.role}`}>{member.role}</span>
                )}
              </div>

              {member.bio && (
                <div className="roster-bio">
                  "{member.bio}"
                </div>
              )}

              <div className="roster-stats-strip">
                <span>Active Workload</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  {member.totalActive} tickets ({member.bugsAssigned} bugs)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Role Permission Matrix */}
      <div>
        <div className="section-header">
          <div className="section-title">
            <Shield size={20} color="var(--primary)" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Permissions enforced at API middleware layer
          </span>
        </div>

        <div className="permission-table-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th>System Capability / Operation</th>
                <th>Admin</th>
                <th>Project Manager</th>
                <th>Developer</th>
                <th>QA Lead</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody>
              {permissionsList.map(perm => (
                <tr key={perm.key}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {perm.label}
                  </td>
                  {['admin', 'pm', 'developer', 'qa', 'viewer'].map(role => {
                    const allowed = roleMatrix?.matrix[role]?.includes(perm.key);
                    return (
                      <td key={role}>
                        {allowed ? (
                          <span className="check-icon">✓ Yes</span>
                        ) : (
                          <span className="cross-icon">— No</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Live Activity Feed */}
      <div>
        <div className="section-header">
          <div className="section-title">
            <Activity size={20} color="#10b981" />
            <span>Live Team Activity Audit</span>
          </div>
        </div>

        <div className="workload-matrix-card" style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {activity.map(act => (
            <div 
              key={act.id} 
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  className="user-avatar" 
                  style={{ width: '24px', height: '24px', fontSize: '10px', backgroundColor: act.user_avatar || '#6366f1' }}
                >
                  {act.user_name ? act.user_name.charAt(0) : 'S'}
                </div>
                <span>
                  <strong>{act.user_name || 'System'}</strong>: {act.details || act.action}
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} />
                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
