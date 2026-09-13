import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  AlertOctagon, 
  Plus,
  Flame,
  CheckCircle2
} from 'lucide-react';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' }
];

export default function KanbanBoard({ 
  issues, 
  onMoveStatus, 
  onSelectIssue, 
  onQuickAdd 
}) {
  const { can } = useAuth();
  const [activeMobileCol, setActiveMobileCol] = useState('all');

  const getNextStatus = (current) => {
    const idx = COLUMNS.findIndex(c => c.id === current);
    if (idx !== -1 && idx < COLUMNS.length - 1) return COLUMNS[idx + 1].id;
    return null;
  };

  const getPrevStatus = (current) => {
    const idx = COLUMNS.findIndex(c => c.id === current);
    if (idx > 0) return COLUMNS[idx - 1].id;
    return null;
  };

  return (
    <div>
      {/* Mobile Column Switcher Tabs */}
      <div className="kanban-mobile-tabs">
        <button
          className={`kanban-mobile-tab ${activeMobileCol === 'all' ? 'active' : ''}`}
          onClick={() => setActiveMobileCol('all')}
        >
          All Columns ({issues.length})
        </button>
        {COLUMNS.map(col => {
          const count = issues.filter(i => i.status === col.id).length;
          return (
            <button
              key={col.id}
              className={`kanban-mobile-tab ${activeMobileCol === col.id ? 'active' : ''}`}
              onClick={() => setActiveMobileCol(col.id)}
            >
              <span className={`status-dot ${col.id}`} style={{ width: '6px', height: '6px' }} />
              <span>{col.label}</span>
              <span style={{ opacity: 0.8, fontSize: '11px' }}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colIssues = issues.filter(i => i.status === col.id);
          const isHiddenOnMobile = activeMobileCol !== 'all' && activeMobileCol !== col.id;
          const isSoloMobileCol = activeMobileCol === col.id;

          return (
            <div 
              key={col.id} 
              className={`kanban-column ${isHiddenOnMobile ? 'hidden-mobile' : ''} ${isSoloMobileCol ? 'active-mobile-column' : ''}`}
            >
            {/* Column Header */}
            <div className="column-header">
              <div className="column-title-group">
                <span className={`status-dot ${col.id}`} />
                <span className="column-name">{col.label}</span>
              </div>
              <span className="column-count">{colIssues.length}</span>
            </div>

            {/* Column Cards */}
            <div className="column-cards">
              {colIssues.map(issue => {
                const next = getNextStatus(issue.status);
                const prev = getPrevStatus(issue.status);

                return (
                  <div 
                    key={issue.id} 
                    className="kanban-card"
                    onClick={() => onSelectIssue(issue)}
                  >
                    {/* Card Top: Key, Type, Severity */}
                    <div className="card-top">
                      <span className="ticket-id">{issue.id}</span>
                      <div className="card-badges">
                        <span className={`badge badge-${issue.type}`}>
                          {issue.type}
                        </span>
                        {issue.type === 'bug' && issue.severity && (
                          <span className={`badge severity-${issue.severity}`}>
                            {issue.severity === 'blocker' && <Flame size={10} style={{ marginRight: '2px' }} />}
                            {issue.severity}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="card-title">
                      {issue.title}
                    </div>

                    {/* Card Footer: Priority, Comments, Assignee, Move Actions */}
                    <div className="card-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`priority-${issue.priority}`} style={{ textTransform: 'capitalize', fontSize: '11px', fontWeight: 600 }}>
                          • {issue.priority}
                        </span>
                        {issue.comment_count > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                            <MessageSquare size={11} />
                            {issue.comment_count}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {issue.assignee_name ? (
                          <div 
                            className="user-avatar"
                            style={{ 
                              width: '22px', 
                              height: '22px', 
                              fontSize: '10px',
                              backgroundColor: issue.assignee_avatar || '#6366f1' 
                            }}
                            title={`Assigned to ${issue.assignee_name}`}
                          >
                            {issue.assignee_name.charAt(0)}
                          </div>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Unassigned</span>
                        )}

                        {/* Quick Move Buttons (if permitted) */}
                        {can('move_issue') && (
                          <div className="quick-move-btns" onClick={(e) => e.stopPropagation()}>
                            {prev && (
                              <button 
                                className="btn-icon-sm"
                                title={`Move to ${prev}`}
                                onClick={() => onMoveStatus(issue.id, prev)}
                              >
                                <ChevronLeft size={14} />
                              </button>
                            )}
                            {next && (
                              <button 
                                className="btn-icon-sm"
                                title={`Move to ${next}`}
                                onClick={() => onMoveStatus(issue.id, next)}
                              >
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quick Add Button at bottom of column */}
              {can('create_issue') && (
                <button 
                  className="btn btn-secondary"
                  style={{ width: '100%', borderStyle: 'dashed', marginTop: '6px', fontSize: '12px', padding: '6px' }}
                  onClick={() => onQuickAdd(col.id)}
                >
                  <Plus size={14} />
                  <span>Add card</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
