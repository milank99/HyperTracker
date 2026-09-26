import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Trash2,
  Share2,
  Lock,
  Users as UsersIcon,
  X,
  Save,
  FileText,
  Eye,
  Pencil,
  Search
} from 'lucide-react';

export default function NotesView() {
  const { apiFetch, showToast, currentUser, users } = useAuth();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUserId, setShareUserId] = useState('');
  const [sharePermission, setSharePermission] = useState('view');

  // List filters
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [noteSearch, setNoteSearch] = useState('');

  const loadNotes = useCallback(async () => {
    try {
      const data = await apiFetch('/api/notes');
      setNotes(data);
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const openNote = async (noteId) => {
    try {
      const full = await apiFetch(`/api/notes/${noteId}`);
      setActiveNote(full);
      setTitle(full.title);
      setContent(full.content || '');
      setDirty(false);
      setShareOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleNewNote = async () => {
    try {
      const created = await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled Note', content: '' })
      });
      await loadNotes();
      openNote(created.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const canEdit = activeNote && (activeNote.is_owner || activeNote.permission === 'edit');

  const handleSave = async () => {
    if (!activeNote || !canEdit) return;
    if (!title.trim()) {
      showToast('Note title cannot be empty.', 'error');
      return;
    }
    try {
      setSaving(true);
      await apiFetch(`/api/notes/${activeNote.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: title.trim(), content })
      });
      setDirty(false);
      await loadNotes();
      showToast('Note saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNote || !activeNote.is_owner) return;
    if (!window.confirm(`Delete "${activeNote.title}"? This cannot be undone.`)) return;

    try {
      await apiFetch(`/api/notes/${activeNote.id}`, { method: 'DELETE' });
      showToast('Note deleted.', 'success');
      setActiveNote(null);
      loadNotes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareUserId) {
      showToast('Choose a teammate to share with.', 'error');
      return;
    }
    try {
      await apiFetch(`/api/notes/${activeNote.id}/shares`, {
        method: 'POST',
        body: JSON.stringify({ userId: shareUserId, permission: sharePermission })
      });
      showToast('Note shared securely.', 'success');
      setShareUserId('');
      openNote(activeNote.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRevoke = async (userId) => {
    try {
      await apiFetch(`/api/notes/${activeNote.id}/shares/${userId}`, { method: 'DELETE' });
      showToast('Access revoked.', 'success');
      openNote(activeNote.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const shareCandidates = users.filter(u =>
    u.id !== currentUser?.id &&
    u.is_active &&
    !(activeNote?.shares || []).some(s => s.user_id === u.id)
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        Loading your notes...
      </div>
    );
  }

  const filteredNotes = notes.filter(note => {
    if (ownershipFilter === 'mine' && !note.is_owner) return false;
    if (ownershipFilter === 'shared' && note.is_owner) return false;
    if (permissionFilter !== 'all' && !note.is_owner && note.permission !== permissionFilter) return false;
    if (noteSearch.trim() && !note.title.toLowerCase().includes(noteSearch.trim().toLowerCase())) return false;
    return true;
  });
  const activeNoteFilterCount = (ownershipFilter !== 'all' ? 1 : 0) + (permissionFilter !== 'all' ? 1 : 0) + (noteSearch.trim() ? 1 : 0);
  const clearNoteFilters = () => { setOwnershipFilter('all'); setPermissionFilter('all'); setNoteSearch(''); };

  return (
    <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 160px)', minHeight: '480px' }}>
      {/* Notes list */}
      <div style={{
        width: '280px',
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>My Notes</span>
          <button className="btn btn-primary" onClick={handleNewNote} style={{ padding: '5px 9px', fontSize: '12px' }}>
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>

        {/* Note Filters */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="text-input"
              placeholder="Search titles..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              style={{ paddingLeft: '24px', width: '100%', fontSize: '12px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select className="select-input" value={ownershipFilter} onChange={(e) => setOwnershipFilter(e.target.value)} style={{ flex: 1, fontSize: '11.5px', padding: '4px 6px' }}>
              <option value="all">All Notes</option>
              <option value="mine">My Notes</option>
              <option value="shared">Shared With Me</option>
            </select>
            <select className="select-input" value={permissionFilter} onChange={(e) => setPermissionFilter(e.target.value)} style={{ flex: 1, fontSize: '11.5px', padding: '4px 6px' }}>
              <option value="all">Any Access</option>
              <option value="view">View Only</option>
              <option value="edit">Can Edit</option>
            </select>
          </div>
          {activeNoteFilterCount > 0 && (
            <button className="btn btn-secondary" onClick={clearNoteFilters} style={{ padding: '3px 8px', fontSize: '11px', alignSelf: 'flex-start' }}>
              <X size={11} />
              <span>Clear filters ({activeNoteFilterCount})</span>
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {notes.length === 0 ? (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center' }}>
              No notes yet. Create your first private note.
            </div>
          ) : filteredNotes.length === 0 ? (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center' }}>
              No notes match the current filters.
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => openNote(note.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: activeNote?.id === note.id ? 'var(--bg-subtle)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  <FileText size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</span>
                </div>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {note.is_owner ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Lock size={10} /> Private</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {note.permission === 'edit' ? <Pencil size={10} /> : <Eye size={10} />}
                      Shared by {note.owner_name}
                    </span>
                  )}
                  {note.is_owner && note.share_count > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <UsersIcon size={10} /> {note.share_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{
        flex: 1,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {!activeNote ? (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
            <FileText size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <div style={{ marginBottom: '14px' }}>Select a note on the left, or create a new one to get started.</div>
            <button className="btn btn-primary" onClick={handleNewNote} style={{ margin: '0 auto' }}>
              <Plus size={15} />
              <span>New Note</span>
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                className="text-input"
                value={title}
                disabled={!canEdit}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                style={{ fontWeight: 700, fontSize: '15px', flex: 1 }}
                placeholder="Note title"
              />

              {canEdit && (
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '7px 12px' }}>
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : dirty ? 'Save*' : 'Save'}</span>
                </button>
              )}

              {activeNote.is_owner && (
                <button className="btn btn-secondary" onClick={() => setShareOpen(!shareOpen)} style={{ padding: '7px 12px' }}>
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
              )}

              {activeNote.is_owner && (
                <button className="btn-icon-sm" onClick={handleDelete} title="Delete note">
                  <Trash2 size={15} color="#9E2B20" />
                </button>
              )}
            </div>

            {shareOpen && activeNote.is_owner && (
              <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Share this note securely
                </div>

                {shareCandidates.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    No other active teammates to share with yet. Add team members from the Admin Console first.
                  </div>
                ) : (
                  <form onSubmit={handleShare} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <select className="select-input" value={shareUserId} onChange={(e) => setShareUserId(e.target.value)} style={{ flex: 1 }}>
                      <option value="">Select a teammate...</option>
                      {shareCandidates.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    <select className="select-input" value={sharePermission} onChange={(e) => setSharePermission(e.target.value)}>
                      <option value="view">Can view</option>
                      <option value="edit">Can edit</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ padding: '7px 12px' }}>
                      Share
                    </button>
                  </form>
                )}

                {activeNote.shares.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeNote.shares.map(s => (
                      <div key={s.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="user-avatar" style={{ width: '20px', height: '20px', fontSize: '10px', backgroundColor: s.avatar_color || '#6366f1' }}>
                            {s.name.charAt(0)}
                          </div>
                          {s.name}
                          <span style={{ color: 'var(--text-muted)' }}>({s.permission})</span>
                        </span>
                        <button className="btn-icon-sm" onClick={() => handleRevoke(s.user_id)} title="Revoke access">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              className="form-textarea"
              value={content}
              disabled={!canEdit}
              onChange={(e) => { setContent(e.target.value); setDirty(true); }}
              placeholder="Write your note here..."
              style={{ flex: 1, border: 'none', borderRadius: 0, resize: 'none', padding: '16px' }}
            />
          </>
        )}
      </div>
    </div>
  );
}
