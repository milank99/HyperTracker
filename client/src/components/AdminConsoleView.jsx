import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  UserPlus, 
  KeyRound, 
  UserX, 
  UserCheck, 
  Database, 
  FolderKanban, 
  Lock, 
  CheckCircle2,
  AlertTriangle,
  Mail,
  Plus,
  Trash2,
  FolderPlus,
  X,
  Search
} from 'lucide-react';

export default function AdminConsoleView({ onOpenNewProfile, onOpenBackup }) {
  const { users, currentUser, apiFetch, showToast, refreshUsers, projects, refreshProjects } = useAuth();
  const [resettingId, setResettingId] = useState(null);

  // User table filters
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // Project table filters
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [projectSearch, setProjectSearch] = useState('');

  // New Project Form State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectOwnerId, setNewProjectOwnerId] = useState('');
  const [projectSubmitting, setProjectSubmitting] = useState(false);

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser.id) {
      showToast('Cannot deactivate your own active admin account.', 'error');
      return;
    }

    try {
      const res = await apiFetch(`/api/users/${user.id}/toggle-status`, {
        method: 'PATCH'
      });
      showToast(res.message, 'success');
      refreshUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleResetPassword = async (user) => {
    const newPass = window.prompt(`Enter new password for ${user.name} (or leave blank for "password123"):`, 'password123');
    if (newPass === null) return;

    try {
      setResettingId(user.id);
      const res = await apiFetch(`/api/users/${user.id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: newPass.trim() || 'password123' })
      });
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setResettingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      showToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
      refreshUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectKey.trim()) {
      showToast('Project name and key are required.', 'error');
      return;
    }

    try {
      setProjectSubmitting(true);
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName.trim(),
          key: newProjectKey.trim().toUpperCase(),
          description: newProjectDesc.trim(),
          owner_id: newProjectOwnerId || currentUser.id
        })
      });

      showToast(`Project [${newProjectKey.toUpperCase()}] "${newProjectName}" created!`, 'success');
      setIsCreatingProject(false);
      setNewProjectName('');
      setNewProjectKey('');
      setNewProjectDesc('');
      refreshProjects();
    } catch (err) {
      showToast(err.message || 'Failed to create project', 'error');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    const isActive = u.is_active !== 0;
    if (userStatusFilter === 'active' && !isActive) return false;
    if (userStatusFilter === 'inactive' && isActive) return false;
    if (userSearch.trim()) {
      const q = userSearch.trim().toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const activeUserFilterCount = (userRoleFilter !== 'all' ? 1 : 0) + (userStatusFilter !== 'all' ? 1 : 0) + (userSearch.trim() ? 1 : 0);
  const clearUserFilters = () => { setUserRoleFilter('all'); setUserStatusFilter('all'); setUserSearch(''); };

  const filteredProjects = projects.filter(p => {
    if (projectStatusFilter !== 'all' && p.status !== projectStatusFilter) return false;
    if (projectSearch.trim()) {
      const q = projectSearch.trim().toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.key.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const activeProjectFilterCount = (projectStatusFilter !== 'all' ? 1 : 0) + (projectSearch.trim() ? 1 : 0);
  const clearProjectFilters = () => { setProjectStatusFilter('all'); setProjectSearch(''); };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Are you sure you want to delete project [${project.key}] "${project.name}"? All associated tickets will be deleted!`)) {
      return;
    }

    try {
      await apiFetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      showToast(`Project [${project.key}] deleted.`, 'info');
      refreshProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Console Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
              Admin Control Console
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage projects, team accounts, security roles, and local database backups.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onOpenBackup}>
            <Database size={15} />
            <span>SQLite Backups</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setIsCreatingProject(!isCreatingProject)}>
            <FolderPlus size={15} color="var(--primary)" />
            <span>+ Add Project</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenNewProfile}>
            <UserPlus size={15} />
            <span>+ Add New User</span>
          </button>
        </div>
      </div>

      {/* User Accounts Management Table */}
      <div className="workload-matrix-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Team User Directory & Access Governance</span>
            <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              {filteredUsers.length} of {users.length} accounts
            </span>
          </div>
        </div>

        {/* User Filter Bar */}
        <div className="filters-group" style={{ margin: '12px 0 4px' }}>
          <select className="select-input" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="pm">Manager (PM)</option>
            <option value="developer">Developer</option>
            <option value="qa">QA Lead</option>
            <option value="viewer">Viewer</option>
          </select>

          <select className="select-input" value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="text-input"
              placeholder="Search name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ paddingLeft: '28px', width: '100%' }}
            />
          </div>

          {activeUserFilterCount > 0 && (
            <button className="btn btn-secondary" onClick={clearUserFilters} style={{ padding: '5px 10px', fontSize: '12px' }}>
              <X size={13} />
              <span>Clear ({activeUserFilterCount})</span>
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Title</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Account Status</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No user accounts match the current filters.
                  </td>
                </tr>
              ) : filteredUsers.map(u => {
                const isActive = u.is_active !== 0;
                const isSelf = u.id === currentUser.id;

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {/* User Identity */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          className="user-avatar"
                          style={{ backgroundColor: u.avatar_color || '#6366f1', width: '32px', height: '32px', fontSize: '12px' }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.name} {isSelf && <span style={{ fontSize: '11px', color: 'var(--primary)' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td style={{ padding: '12px 14px' }}>
                      {isSelf ? (
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      ) : (
                        <select
                          className="select-input"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ fontSize: '11.5px', padding: '3px 8px', fontWeight: 600 }}
                        >
                          <option value="admin">Admin</option>
                          <option value="pm">Manager (PM)</option>
                          <option value="developer">Developer</option>
                          <option value="qa">QA Lead</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}
                    </td>

                    {/* Title */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {u.title || 'Team Member'}
                    </td>

                    {/* Active Status Badge */}
                    <td style={{ padding: '12px 14px' }}>
                      {isActive ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3E7351', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9E2B20', fontWeight: 600 }}>
                          <AlertTriangle size={13} /> Deactivated
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                          title="Reset Password"
                          onClick={() => handleResetPassword(u)}
                          disabled={resettingId === u.id}
                        >
                          <KeyRound size={13} />
                          <span>Reset Password</span>
                        </button>

                        {!isSelf && (
                          <button
                            className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ padding: '4px 10px', fontSize: '11.5px' }}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {isActive ? <UserX size={13} color="#9E2B20" /> : <UserCheck size={13} />}
                            <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional: Inline Create Project Form */}
      {isCreatingProject && (
        <div className="workload-matrix-card" style={{ border: '1px solid var(--primary)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
              <FolderPlus size={18} color="var(--primary)" />
              <span>Create New Project</span>
            </div>
            <button className="btn-icon-sm" onClick={() => setIsCreatingProject(false)}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="e.g. Platform Core, Mobile App" 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ticket Key Prefix * (e.g. CORE, APP)</label>
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="e.g. CORE" 
                  value={newProjectKey} 
                  onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())} 
                  maxLength={6}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Lead / Owner</label>
                <select 
                  className="select-input" 
                  value={newProjectOwnerId} 
                  onChange={(e) => setNewProjectOwnerId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Project Scope / Description</label>
              <textarea 
                className="text-input" 
                rows={2} 
                placeholder="Key goals, architecture notes, or project vision..." 
                value={newProjectDesc} 
                onChange={(e) => setNewProjectDesc(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingProject(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={projectSubmitting}>
                {projectSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Directory Table */}
      <div className="workload-matrix-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={17} color="var(--primary)" />
            <span>Active Projects & Workspaces</span>
            <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              {filteredProjects.length} of {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '5px 12px', fontSize: '12px' }}
            onClick={() => setIsCreatingProject(true)}
          >
            <Plus size={13} />
            <span>Add Project</span>
          </button>
        </div>

        {/* Project Filter Bar */}
        {projects.length > 0 && (
          <div className="filters-group" style={{ margin: '0 0 14px' }}>
            <select className="select-input" value={projectStatusFilter} onChange={(e) => setProjectStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="archived">Archived</option>
            </select>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="text-input"
                placeholder="Search name or key..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                style={{ paddingLeft: '28px', width: '100%' }}
              />
            </div>

            {activeProjectFilterCount > 0 && (
              <button className="btn btn-secondary" onClick={clearProjectFilters} style={{ padding: '5px 10px', fontSize: '12px' }}>
                <X size={13} />
                <span>Clear ({activeProjectFilterCount})</span>
              </button>
            )}
          </div>
        )}

        {projects.length === 0 ? (
          <div style={{ 
            padding: '32px 20px', 
            textAlign: 'center', 
            background: 'var(--bg-subtle)', 
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-card)'
          }}>
            <FolderKanban size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No Projects Configured Yet
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '6px auto 16px auto' }}>
              Get started by creating your team's first project to start organizing tasks, sprints, and bugs.
            </p>
            <button className="btn btn-primary" onClick={() => setIsCreatingProject(true)}>
              <Plus size={14} />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: '500' }}>Key</th>
                  <th style={{ padding: '10px 14px', fontWeight: '500' }}>Project Name</th>
                  <th style={{ padding: '10px 14px', fontWeight: '500' }}>Lead</th>
                  <th style={{ padding: '10px 14px', fontWeight: '500' }}>Tickets</th>
                  <th style={{ padding: '10px 14px', fontWeight: '500' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No projects match the current filters.
                    </td>
                  </tr>
                ) : filteredProjects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--primary)' }}>
                      [{p.key}]
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {p.owner_name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {p.total_issues || 0} tickets
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        className="btn-icon-sm"
                        title="Delete Project"
                        onClick={() => handleDeleteProject(p)}
                        style={{ color: '#9E2B20' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
