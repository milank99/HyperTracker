import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Bug, 
  Flame, 
  TrendingUp,
  FolderKanban
} from 'lucide-react';

export default function MetricsDashboard({ issues, projects }) {
  const total = issues.length;
  const done = issues.filter(i => i.status === 'done' || i.status === 'closed').length;
  const resolutionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  
  const bugs = issues.filter(i => i.type === 'bug');
  const openBugs = bugs.filter(i => i.status !== 'done' && i.status !== 'closed');
  const blockerCount = bugs.filter(b => b.severity === 'blocker' && b.status !== 'done').length;

  const statusBreakdown = {
    backlog: issues.filter(i => i.status === 'backlog').length,
    todo: issues.filter(i => i.status === 'todo').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    in_review: issues.filter(i => i.status === 'in_review').length,
    done: issues.filter(i => i.status === 'done').length
  };

  const priorityBreakdown = {
    urgent: issues.filter(i => i.priority === 'urgent').length,
    high: issues.filter(i => i.priority === 'high').length,
    medium: issues.filter(i => i.priority === 'medium').length,
    low: issues.filter(i => i.priority === 'low').length
  };

  const severityBreakdown = {
    blocker: bugs.filter(b => b.severity === 'blocker').length,
    critical: bugs.filter(b => b.severity === 'critical').length,
    major: bugs.filter(b => b.severity === 'major').length,
    minor: bugs.filter(b => b.severity === 'minor').length
  };

  const pct = (val, max) => (max > 0 ? (val / max) * 100 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top KPI Cards */}
      <div className="team-stats-grid">
        <div className="stat-card emerald">
          <span className="stat-label">Resolution Rate</span>
          <span className="stat-value">{resolutionRate}%</span>
          <span className="stat-sub">{done} of {total} completed</span>
        </div>
        <div className="stat-card primary">
          <span className="stat-label">Total Backlog Items</span>
          <span className="stat-value">{total}</span>
          <span className="stat-sub">Across all workspace projects</span>
        </div>
        <div className="stat-card rose">
          <span className="stat-label">Active Bugs</span>
          <span className="stat-value">{openBugs.length}</span>
          <span className="stat-sub">{blockerCount} critical blockers</span>
        </div>
        <div className="stat-card cyan">
          <span className="stat-label">Bug-to-Task Ratio</span>
          <span className="stat-value">
            {total > 0 ? ((bugs.length / total) * 100).toFixed(0) : 0}%
          </span>
          <span className="stat-sub">{bugs.length} total bugs logged</span>
        </div>
      </div>

      {/* Grid of Distribution Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Status Distribution */}
        <div className="workload-matrix-card">
          <div style={{ fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--primary)" />
            <span>Workflow Status Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{status.replace('_', ' ')}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count} ({pct(count, total).toFixed(0)}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${pct(count, total)}%`, 
                      background: `var(--status-${status.replace('_', '')})`,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bug Severity Distribution */}
        <div className="workload-matrix-card">
          <div style={{ fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bug size={16} color="var(--severity-critical)" />
            <span>Bug Severity Impact</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(severityBreakdown).map(([severity, count]) => (
              <div key={severity}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{severity}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count} ({pct(count, bugs.length).toFixed(0)}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${pct(count, bugs.length)}%`, 
                      background: `var(--severity-${severity})`,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="workload-matrix-card">
          <div style={{ fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={16} color="var(--priority-urgent)" />
            <span>Priority Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(priorityBreakdown).map(([prio, count]) => (
              <div key={prio}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{prio}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count} ({pct(count, total).toFixed(0)}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${pct(count, total)}%`, 
                      background: `var(--priority-${prio})`,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Health Table */}
      <div className="workload-matrix-card">
        <div style={{ fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderKanban size={18} color="var(--accent-cyan)" />
          <span>Project Health & Completion Status</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 14px' }}>Project</th>
                <th style={{ padding: '10px 14px' }}>Owner</th>
                <th style={{ padding: '10px 14px' }}>Total Issues</th>
                <th style={{ padding: '10px 14px' }}>Done</th>
                <th style={{ padding: '10px 14px' }}>Open Bugs</th>
                <th style={{ padding: '10px 14px' }}>Blockers</th>
                <th style={{ padding: '10px 14px' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => {
                const projTotal = proj.total_issues || 0;
                const projDone = proj.done_issues || 0;
                const progress = projTotal > 0 ? Math.round((projDone / projTotal) * 100) : 0;

                return (
                  <tr key={proj.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                      [{proj.key}] {proj.name}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {proj.owner_name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{projTotal}</td>
                    <td style={{ padding: '10px 14px', color: '#10b981' }}>{projDone}</td>
                    <td style={{ padding: '10px 14px', color: '#f59e0b' }}>{proj.open_bugs || 0}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {proj.blocker_bugs > 0 ? (
                        <span className="badge severity-blocker">{proj.blocker_bugs}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', width: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
