import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Code, 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  GitBranch, 
  Terminal, 
  Clock, 
  Play, 
  SendHorizonal, 
  Kanban 
} from 'lucide-react';

export default function DeveloperWorkspaceView({ 
  issues, 
  onMoveStatus, 
  onSelectIssue,
  onSwitchToKanban 
}) {
  const { currentUser, showToast } = useAuth();
  const [copiedId, setCopiedId] = useState(null);

  // Filter issues assigned to this developer
  const myIssues = issues.filter(i => i.assignee_id === currentUser.id);

  const inProgressIssues = myIssues.filter(i => i.status === 'in_progress');
  const reviewIssues = myIssues.filter(i => i.status === 'in_review');
  const todoIssues = myIssues.filter(i => i.status === 'todo');
  const doneIssues = myIssues.filter(i => i.status === 'done' || i.status === 'closed');

  const myBlockers = myIssues.filter(i => i.type === 'bug' && (i.severity === 'blocker' || i.severity === 'critical') && i.status !== 'done');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied: "${text}"`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
              Developer Focus Workspace
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Prioritized work queue for <strong>{currentUser.name}</strong> ({currentUser.title || 'Engineer'}).
          </p>
        </div>

        <button className="btn btn-secondary" onClick={onSwitchToKanban}>
          <Kanban size={15} />
          <span>View Team Kanban Board</span>
        </button>
      </div>

      {/* Critical Blocker Alert (if any assigned) */}
      {myBlockers.length > 0 && (
        <div className="blocker-alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#9E2B20', borderRadius: '50%', padding: '6px', color: 'white' }}>
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--alert-banner-text)' }}>
                Urgent Blocker Assigned to You ({myBlockers.length})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                You have {myBlockers.length} blocker/critical bug(s) requiring immediate code remediation.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => onSelectIssue(myBlockers[0])}
          >
            Inspect Blocker [{myBlockers[0].id}]
          </button>
        </div>
      )}

      {/* Developer Stats Row */}
      <div className="team-stats-grid">
        <div className="stat-card primary">
          <span className="stat-label">Active Focus Tasks</span>
          <span className="stat-value">{inProgressIssues.length}</span>
          <span className="stat-sub">Currently In Progress</span>
        </div>
        <div className="stat-card cyan">
          <span className="stat-label">In Review / QA</span>
          <span className="stat-value">{reviewIssues.length}</span>
          <span className="stat-sub">Awaiting verification</span>
        </div>
        <div className="stat-card rose">
          <span className="stat-label">Next Up (To Do)</span>
          <span className="stat-value">{todoIssues.length}</span>
          <span className="stat-sub">Ready in backlog</span>
        </div>
        <div className="stat-card emerald">
          <span className="stat-label">Completed Velocity</span>
          <span className="stat-value">{doneIssues.length}</span>
          <span className="stat-sub">Finished tickets</span>
        </div>
      </div>

      {/* Focus Work List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'Newsreader, Georgia, serif' }}>
          Assigned Focus Queue
        </div>

        {myIssues.length === 0 ? (
          <div className="workload-matrix-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--accent-sage)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              No active tickets assigned to you!
            </div>
            <div style={{ fontSize: '12.5px' }}>
              Grab a card from the Team Kanban or assign yourself new tasks.
            </div>
          </div>
        ) : (
          myIssues.map(issue => {
            const gitBranch = `git checkout -b feature/${issue.id.toLowerCase()}`;
            const gitCommit = `git commit -m "${issue.id}: ${issue.title.toLowerCase().replace(/['"]/g, '')}"`;

            return (
              <div 
                key={issue.id}
                className="bug-card-row"
                style={{
                  borderLeft: issue.status === 'in_progress' ? '4px solid var(--primary)' : '1px solid var(--border-card)'
                }}
                onClick={() => onSelectIssue(issue)}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="ticket-id">{issue.id}</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {issue.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${issue.type}`}>{issue.type}</span>
                    <span className={`priority-${issue.priority}`} style={{ textTransform: 'capitalize', fontSize: '11px', fontWeight: 600 }}>
                      • {issue.priority}
                    </span>
                    <span className={`status-dot ${issue.status}`} />
                    <span style={{ fontSize: '11.5px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Git Helper Snippets */}
                <div 
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-subtle)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11.5px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', flexWrap: 'wrap', maxWidth: '100%' }}>
                    <GitBranch size={13} color="var(--primary)" />
                    <code style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{gitBranch}</code>
                    <button 
                      className="btn-icon-sm"
                      title="Copy branch command"
                      onClick={() => copyToClipboard(gitBranch, `branch-${issue.id}`)}
                    >
                      {copiedId === `branch-${issue.id}` ? <Check size={12} color="var(--accent-sage)" /> : <Copy size={12} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', flexWrap: 'wrap', maxWidth: '100%' }}>
                    <Terminal size={13} color="var(--accent-cyan)" />
                    <code style={{ color: 'var(--text-primary)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {gitCommit}
                    </code>
                    <button 
                      className="btn-icon-sm"
                      title="Copy commit command"
                      onClick={() => copyToClipboard(gitCommit, `commit-${issue.id}`)}
                    >
                      {copiedId === `commit-${issue.id}` ? <Check size={12} color="var(--accent-sage)" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Status action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Project: <strong>{issue.project_name}</strong> {issue.due_date && `| Due: ${issue.due_date}`}
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {issue.status === 'todo' && (
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        onClick={() => onMoveStatus(issue.id, 'in_progress')}
                      >
                        <Play size={12} />
                        <span>Start Working</span>
                      </button>
                    )}

                    {issue.status === 'in_progress' && (
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        onClick={() => onMoveStatus(issue.id, 'in_review')}
                      >
                        <SendHorizonal size={12} color="var(--accent-purple)" />
                        <span>Submit for QA / Review</span>
                      </button>
                    )}

                    {issue.status === 'in_review' && (
                      <span style={{ fontSize: '11.5px', color: 'var(--accent-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> Awaiting QA Verification
                      </span>
                    )}

                    {issue.status !== 'done' && (
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        onClick={() => onMoveStatus(issue.id, 'done')}
                      >
                        <CheckCircle2 size={12} color="var(--accent-sage)" />
                        <span>Mark Done</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
