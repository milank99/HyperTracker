import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Flame, Archive, ArchiveRestore, Trash2, X } from 'lucide-react';

export default function ListView({ issues, onSelectIssue, onBulkUpdate, onBulkArchive, onBulkDelete }) {
  const { users, can } = useAuth();
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [bulkAssignee, setBulkAssignee] = useState('');

  const canEdit = can('edit_issue');
  const canDelete = can('delete_issue');
  const showBulkBar = canEdit || canDelete;

  const selectedIssues = useMemo(
    () => issues.filter(i => selectedIds.includes(i.id)),
    [issues, selectedIds]
  );
  const allArchived = selectedIssues.length > 0 && selectedIssues.every(i => i.archived_at);

  const toggleOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === issues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(issues.map(i => i.id));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkStatus('');
    setBulkPriority('');
    setBulkAssignee('');
  };

  const applyBulkUpdate = () => {
    const updates = {};
    if (bulkStatus) updates.status = bulkStatus;
    if (bulkPriority) updates.priority = bulkPriority;
    if (bulkAssignee) updates.assigneeId = bulkAssignee === 'unassigned' ? '' : bulkAssignee;
    if (Object.keys(updates).length === 0) return;
    onBulkUpdate(selectedIds, updates);
    clearSelection();
  };

  const applyBulkArchive = (archived) => {
    onBulkArchive(selectedIds, archived);
    clearSelection();
  };

  const applyBulkDelete = () => {
    onBulkDelete(selectedIds);
    clearSelection();
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Bulk Action Bar */}
      {showBulkBar && selectedIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 16px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {selectedIds.length} selected
          </span>

          {canEdit && (
            <>
              <select className="select-input" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ fontSize: '12px' }}>
                <option value="">Set Status...</option>
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
                <option value="closed">Closed</option>
              </select>

              <select className="select-input" value={bulkPriority} onChange={(e) => setBulkPriority(e.target.value)} style={{ fontSize: '12px' }}>
                <option value="">Set Priority...</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select className="select-input" value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)} style={{ fontSize: '12px' }}>
                <option value="">Assign To...</option>
                <option value="unassigned">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                style={{ padding: '5px 12px', fontSize: '12px' }}
                onClick={applyBulkUpdate}
                disabled={!bulkStatus && !bulkPriority && !bulkAssignee}
              >
                Apply
              </button>
            </>
          )}

          {canDelete && (
            <>
              <button
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '12px' }}
                onClick={() => applyBulkArchive(!allArchived)}
              >
                {allArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                <span>{allArchived ? 'Unarchive' : 'Archive'}</span>
              </button>

              <button
                className="btn btn-danger"
                style={{ padding: '5px 10px', fontSize: '12px' }}
                onClick={applyBulkDelete}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            className="btn-icon-sm"
            style={{ marginLeft: 'auto' }}
            onClick={clearSelection}
            title="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {showBulkBar && (
                <th style={{ padding: '12px 8px 12px 16px', width: '32px' }}>
                  <input
                    type="checkbox"
                    checked={issues.length > 0 && selectedIds.length === issues.length}
                    onChange={toggleAll}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
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
                <td colSpan={showBulkBar ? 9 : 8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
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
                    transition: 'background 0.15s ease',
                    opacity: issue.archived_at ? 0.6 : 1,
                    background: selectedIds.includes(issue.id) ? 'var(--bg-subtle)' : 'transparent'
                  }}
                  onMouseEnter={(e) => { if (!selectedIds.includes(issue.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { if (!selectedIds.includes(issue.id)) e.currentTarget.style.background = 'transparent'; }}
                >
                  {showBulkBar && (
                    <td style={{ padding: '12px 8px 12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(issue.id)}
                        onChange={() => toggleOne(issue.id)}
                      />
                    </td>
                  )}
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
                      {issue.archived_at && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }} title={`Archived ${issue.archived_at}`}>
                          <Archive size={11} />
                          Archived
                        </span>
                      )}
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
