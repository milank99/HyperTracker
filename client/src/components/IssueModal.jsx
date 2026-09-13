import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Trash2, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Bug, 
  CheckCircle2, 
  Terminal,
  Monitor
} from 'lucide-react';

export default function IssueModal({ 
  issue, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  initialType = 'task',
  initialStatus = 'backlog' 
}) {
  const { users, projects, currentUser, can, apiFetch, showToast } = useAuth();
  const isEditing = !!issue;

  // Form State
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('medium');
  const [severity, setSeverity] = useState('minor');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [environment, setEnvironment] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Comments State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (issue) {
      setProjectId(issue.project_id);
      setType(issue.type);
      setTitle(issue.title);
      setDescription(issue.description || '');
      setStatus(issue.status);
      setPriority(issue.priority);
      setSeverity(issue.severity || 'minor');
      setReproductionSteps(issue.reproduction_steps || '');
      setExpectedBehavior(issue.expected_behavior || '');
      setActualBehavior(issue.actual_behavior || '');
      setEnvironment(issue.environment || '');
      setAssigneeId(issue.assignee_id || '');
      setDueDate(issue.due_date || '');

      // Fetch fresh comments for this issue
      fetch(`/api/issues/${issue.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.comments) setComments(data.comments);
        })
        .catch(err => console.error('Failed to fetch comments:', err));
    } else {
      setProjectId(projects[0]?.id || '');
      setType(initialType);
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
      setPriority('medium');
      setSeverity('minor');
      setReproductionSteps('');
      setExpectedBehavior('');
      setActualBehavior('');
      setEnvironment('');
      setAssigneeId('');
      setDueDate('');
      setComments([]);
    }
  }, [issue, isOpen, projects, initialType, initialStatus]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title is required.', 'error');
      return;
    }
    if (!projectId) {
      showToast('Please select a project.', 'error');
      return;
    }

    const payload = {
      project_id: projectId,
      type,
      title: title.trim(),
      description,
      status,
      priority,
      severity: type === 'bug' ? severity : null,
      reproduction_steps: type === 'bug' ? reproductionSteps : null,
      expected_behavior: type === 'bug' ? expectedBehavior : null,
      actual_behavior: type === 'bug' ? actualBehavior : null,
      environment: type === 'bug' ? environment : null,
      assignee_id: assigneeId || null,
      due_date: dueDate || null
    };

    onSave(payload, issue?.id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !issue) return;

    try {
      setSubmittingComment(true);
      const res = await apiFetch(`/api/issues/${issue.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() })
      });
      setComments(prev => [...prev, res]);
      setNewComment('');
      showToast('Comment added', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="modal-title">
              {isEditing ? `Edit [${issue.id}]` : 'Create New Ticket'}
            </span>
            {isEditing && (
              <span className={`badge badge-${type}`}>
                {type}
              </span>
            )}
          </div>
          <button className="btn-icon-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Project & Type */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Project</label>
                <select 
                  className="select-input"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={isEditing}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>[{p.key}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Type</label>
                <select 
                  className="select-input"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="story">Feature Story</option>
                  <option value="epic">Epic</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Title</label>
              <input 
                type="text"
                className="text-input"
                placeholder="Brief summary of the task or bug"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description / Scope</label>
              <textarea 
                className="form-textarea"
                placeholder="Add context, acceptance criteria, or architectural notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Bug-Specific Specialized Fields */}
            {type === 'bug' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', color: '#f87171' }}>
                  <Bug size={16} />
                  <span>Bug Diagnostic Fields</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Steps to Reproduce</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="1. Navigate to Settings&#10;2. Click Export&#10;3. Observe crash"
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expected Behavior</label>
                    <input 
                      type="text"
                      className="text-input"
                      placeholder="What should have happened"
                      value={expectedBehavior}
                      onChange={(e) => setExpectedBehavior(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Actual Behavior</label>
                    <input 
                      type="text"
                      className="text-input"
                      placeholder="What actually occurred / Error message"
                      value={actualBehavior}
                      onChange={(e) => setActualBehavior(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Severity Level</label>
                    <select 
                      className="select-input"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      <option value="minor">Minor (Trivial / Cosmetic)</option>
                      <option value="major">Major (Feature degraded)</option>
                      <option value="critical">Critical (Data risk / Crash)</option>
                      <option value="blocker">Blocker (Release halting)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Environment / OS / Build</label>
                    <input 
                      type="text"
                      className="text-input"
                      placeholder="e.g. macOS Sonoma / Chrome 128 / v1.2"
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Workflow & Assignment Fields */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="select-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="select-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select 
                  className="select-input"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date"
                  className="text-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Comments Thread (Editing mode only) */}
            {isEditing && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} color="var(--primary)" />
                  <span>Discussion & Activity ({comments.length})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {comments.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      No comments yet. Post the first update below!
                    </div>
                  ) : (
                    comments.map(c => (
                      <div 
                        key={c.id} 
                        style={{ 
                          background: 'rgba(255,255,255,0.03)', 
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 12px',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div 
                              className="user-avatar" 
                              style={{ width: '18px', height: '18px', fontSize: '9px', backgroundColor: c.author_avatar || '#6366f1' }}
                            >
                              {c.author_name ? c.author_name.charAt(0) : 'U'}
                            </div>
                            <strong style={{ fontSize: '12px' }}>{c.author_name}</strong>
                            <span className={`role-badge role-${c.author_role}`}>{c.author_role}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>{c.content}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                {can('comment') && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      className="text-input"
                      placeholder="Write a comment or note..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(e);
                        }
                      }}
                    />
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddComment}
                      disabled={submittingComment || !newComment.trim()}
                    >
                      <Send size={14} />
                      <span>Post</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            {isEditing && can('delete_issue') && (
              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ marginRight: 'auto' }}
                onClick={() => onDelete(issue.id)}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
