import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Download, Upload, RotateCcw, Database, AlertTriangle } from 'lucide-react';

export default function BackupModal({ isOpen, onClose, onRefreshData }) {
  const { apiFetch, showToast, can } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    window.location.href = '/api/backup/export';
    showToast('Exporting workspace backup...', 'info');
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset all projects, tasks, bugs, and profiles to default startup demo data? Any custom tickets will be overwritten.')) {
      return;
    }

    try {
      setResetting(true);
      await apiFetch('/api/backup/reset-seed', { method: 'POST' });
      showToast('Database reset to default demo seed data!', 'success');
      if (onRefreshData) onRefreshData();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      await apiFetch('/api/backup/import', {
        method: 'POST',
        body: JSON.stringify(parsed)
      });

      showToast('Workspace backup restored successfully!', 'success');
      if (onRefreshData) onRefreshData();
      onClose();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--primary)" />
            <span className="modal-title">SQLite File Database Management</span>
          </div>
          <button className="btn-icon-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            All workspace projects, tasks, bugs, team profiles, and comments are stored in the local file 
            <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>data/tracker.db</code>.
          </p>

          {/* Export */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>Download Workspace Backup</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Export full database snapshot as a portable JSON file.</div>
            </div>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={15} />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Import (if Admin) */}
          {can('backup_restore') && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>Restore From Backup</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload previously exported JSON backup file.</div>
              </div>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={15} />
                <span>{importing ? 'Restoring...' : 'Upload JSON'}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} disabled={importing} />
              </label>
            </div>
          )}

          {/* Reset Demo Seed (if Admin) */}
          {can('backup_restore') && (
            <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#f87171', marginBottom: '2px' }}>Reset Demo Workspace</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Restore default startup team profiles, sample projects, and bugs.</div>
              </div>
              <button className="btn btn-danger" onClick={handleResetSeed} disabled={resetting}>
                <RotateCcw size={15} />
                <span>{resetting ? 'Resetting...' : 'Reset Seed'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
