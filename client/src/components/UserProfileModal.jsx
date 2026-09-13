import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Lock, Check, Shield } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#D97757', // Terracotta
  '#f43f5e'  // Rose
];

export default function UserProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile, changePassword, showToast } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Profile fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setTitle(currentUser.title || '');
      setAvatarColor(currentUser.avatar_color || '#6366f1');
      setBio(currentUser.bio || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({
        name: name.trim(),
        title: title.trim(),
        avatar_color: avatarColor,
        bio: bio.trim()
      });
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--primary)" />
            <span className="modal-title">My Profile & Settings</span>
          </div>
          <button className="btn-icon-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px', background: 'var(--bg-card)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Profile Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'password' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'password' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Change Password
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit}>
            <div className="modal-body">
              {/* Profile summary preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div
                  className="user-avatar"
                  style={{ backgroundColor: avatarColor, width: '48px', height: '48px', fontSize: '18px' }}
                >
                  {name.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{name || 'Your Name'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span className={`role-badge role-${currentUser.role}`}>{currentUser.role}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="text-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Title / Role Specialty</label>
                <input
                  type="text"
                  className="text-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                />
              </div>

              {/* Avatar Color Picker */}
              <div className="form-group">
                <label className="form-label">Avatar Color</label>
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
                        boxShadow: avatarColor === c ? '0 0 8px ' + c : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bio / Focus Area</label>
                <textarea
                  className="form-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Tell your team about your responsibilities..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="text-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="text-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="text-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
