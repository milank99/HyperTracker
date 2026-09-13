import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, Shield } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#f43f5e'  // Rose
];

export default function ProfileModal({ isOpen, onClose, onProfileCreated }) {
  const { apiFetch, showToast, refreshUsers } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('developer');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Name and Email are required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          title: title.trim() || 'Team Member',
          role,
          avatar_color: avatarColor,
          bio: bio.trim()
        })
      });

      showToast(`Team profile created for ${res.name} (${res.role.toUpperCase()})`, 'success');
      await refreshUsers();
      if (onProfileCreated) onProfileCreated(res);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} color="var(--primary)" />
            <span className="modal-title">Create Team Member Profile</span>
          </div>
          <button className="btn-icon-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text"
                className="text-input"
                placeholder="e.g. Jessica Wu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input 
                type="email"
                className="text-input"
                placeholder="e.g. jessica@startup.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Job Title / Specialty</label>
                <input 
                  type="text"
                  className="text-input"
                  placeholder="e.g. DevOps Lead, Frontend Architect"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Access Role</label>
                <select 
                  className="select-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="developer">Developer (Code, status moves, edits)</option>
                  <option value="qa">QA / Tester (Bug reports, repro, verification)</option>
                  <option value="pm">Project Manager (Sprints, projects, assignments)</option>
                  <option value="admin">Admin / Owner (Full access, roles, backups)</option>
                  <option value="viewer">Viewer (Read-only observer)</option>
                </select>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div className="form-group">
              <label className="form-label">Profile Avatar Color</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: avatarColor === c ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer',
                      boxShadow: avatarColor === c ? '0 0 10px ' + c : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio / Focus Area</label>
              <textarea 
                className="form-textarea"
                placeholder="Brief bio or engineering responsibilities..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
