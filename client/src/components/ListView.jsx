import React from 'react';
import { MessageSquare, Flame } from 'lucide-react';

export default function ListView({ issues, onSelectIssue }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Key</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Type</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Title</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Priority</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Severity</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Assignee</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Project</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No tickets found matching current filters.
                </td>
              </tr>
            ) : (
              issues.map(issue => (
                <tr 
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span className="ticket-id">{issue.id}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-${issue.type}`}>
                      {issue.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{issue.title}</span>
                      {issue.comment_count > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MessageSquare size={11} />
                          {issue.comment_count}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                      <span className={`status-dot ${issue.status}`} />
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`priority-${issue.priority}`} style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {issue.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {issue.type === 'bug' && issue.severity ? (
                      <span className={`badge severity-${issue.severity}`}>
                        {issue.severity === 'blocker' && <Flame size={10} style={{ marginRight: '2px' }} />}
                        {issue.severity}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {issue.assignee_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div 
                          className="user-avatar"
                          style={{ width: '20px', height: '20px', fontSize: '10px', backgroundColor: issue.assignee_avatar || '#6366f1' }}
                        >
                          {issue.assignee_name.charAt(0)}
                        </div>
                        <span>{issue.assignee_name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {issue.project_name}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
