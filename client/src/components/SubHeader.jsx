import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, FolderKanban, X, BookmarkPlus, Trash2 } from 'lucide-react';

const PRESETS_KEY_PREFIX = 'hypertrack_filter_presets_';

export default function SubHeader({
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  severityFilter,
  setSeverityFilter,
  assigneeFilter,
  setAssigneeFilter,
  reporterFilter,
  setReporterFilter,
  dueFilter,
  setDueFilter,
  archivedFilter,
  setArchivedFilter,
  searchTerm,
  setSearchTerm,
  onClearAll,
  totalCount
}) {
  const { projects, selectedProjectId, setSelectedProjectId, users, currentUser, showToast } = useAuth();

  const activeFilterCount = [
    typeFilter, priorityFilter, statusFilter, severityFilter, assigneeFilter, reporterFilter, dueFilter
  ].filter(f => f !== 'all').length + (searchTerm.trim() ? 1 : 0) + (archivedFilter !== 'active' ? 1 : 0);

  // Saved filter presets (per-user, stored locally in this browser)
  const presetsKey = `${PRESETS_KEY_PREFIX}${currentUser?.id || 'guest'}`;
  const [presets, setPresets] = useState([]);
  const [selectedPresetName, setSelectedPresetName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(presetsKey);
      setPresets(raw ? JSON.parse(raw) : []);
    } catch {
      setPresets([]);
    }
    setSelectedPresetName('');
  }, [presetsKey]);

  const currentFilters = {
    projectId: selectedProjectId,
    typeFilter, priorityFilter, statusFilter, severityFilter,
    assigneeFilter, reporterFilter, dueFilter, archivedFilter, searchTerm
  };

  const handleSavePreset = () => {
    const name = window.prompt('Name this filter preset (e.g. "My Overdue Bugs"):');
    if (!name || !name.trim()) return;

    const next = [...presets.filter(p => p.name !== name.trim()), { name: name.trim(), filters: currentFilters }];
    setPresets(next);
    localStorage.setItem(presetsKey, JSON.stringify(next));
    setSelectedPresetName(name.trim());
    showToast(`Saved filter preset "${name.trim()}"`, 'success');
  };

  const applyPreset = useCallback((name) => {
    const preset = presets.find(p => p.name === name);
    if (!preset) return;
    const f = preset.filters;
    if (f.projectId !== undefined) setSelectedProjectId(f.projectId);
    setTypeFilter(f.typeFilter ?? 'all');
    setPriorityFilter(f.priorityFilter ?? 'all');
    setStatusFilter(f.statusFilter ?? 'all');
    setSeverityFilter(f.severityFilter ?? 'all');
    setAssigneeFilter(f.assigneeFilter ?? 'all');
    setReporterFilter(f.reporterFilter ?? 'all');
    setDueFilter(f.dueFilter ?? 'all');
    setArchivedFilter(f.archivedFilter ?? 'active');
    setSearchTerm(f.searchTerm ?? '');
  }, [presets, setSelectedProjectId, setTypeFilter, setPriorityFilter, setStatusFilter, setSeverityFilter, setAssigneeFilter, setReporterFilter, setDueFilter, setArchivedFilter, setSearchTerm]);

  const handleSelectPreset = (name) => {
    setSelectedPresetName(name);
    if (name) applyPreset(name);
  };

  const handleDeletePreset = () => {
    if (!selectedPresetName) return;
    const next = presets.filter(p => p.name !== selectedPresetName);
    setPresets(next);
    localStorage.setItem(presetsKey, JSON.stringify(next));
    setSelectedPresetName('');
  };

  return (
    <div className="sub-header">
      <div className="filters-group">
        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FolderKanban size={16} color="var(--primary)" />
          <select
            className="select-input"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                [{p.key}] {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Type Filter */}
        <select
          className="select-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="task">Tasks</option>
          <option value="bug">Bugs Only</option>
          <option value="story">Stories</option>
          <option value="epic">Epics</option>
        </select>

        {/* Status Filter */}
        <select
          className="select-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
          <option value="closed">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          className="select-input"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Severity Filter (bugs) */}
        <select
          className="select-input"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="all">All Severities</option>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
          <option value="critical">Critical</option>
          <option value="blocker">Blocker</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="select-input"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="all">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Reporter Filter */}
        <select
          className="select-input"
          value={reporterFilter}
          onChange={(e) => setReporterFilter(e.target.value)}
        >
          <option value="all">All Reporters</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Due Date Filter */}
        <select
          className="select-input"
          value={dueFilter}
          onChange={(e) => setDueFilter(e.target.value)}
        >
          <option value="all">Any Due Date</option>
          <option value="overdue">Overdue</option>
          <option value="this_week">Due This Week</option>
          <option value="no_date">No Due Date</option>
        </select>

        {/* Archived Filter */}
        <select
          className="select-input"
          value={archivedFilter}
          onChange={(e) => setArchivedFilter(e.target.value)}
        >
          <option value="active">Active Only</option>
          <option value="only">Archived Only</option>
          <option value="all">Active + Archived</option>
        </select>

        {/* Saved Filter Presets */}
        {presets.length > 0 && (
          <select
            className="select-input"
            value={selectedPresetName}
            onChange={(e) => handleSelectPreset(e.target.value)}
            title="Load a saved filter preset"
          >
            <option value="">Load Preset...</option>
            {presets.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        )}

        {selectedPresetName && (
          <button
            className="btn-icon-sm"
            onClick={handleDeletePreset}
            title={`Delete preset "${selectedPresetName}"`}
          >
            <Trash2 size={13} />
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={handleSavePreset}
          style={{ padding: '5px 10px', fontSize: '12px' }}
          title="Save the current filters as a reusable preset"
        >
          <BookmarkPlus size={13} />
          <span>Save Preset</span>
        </button>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={onClearAll}
            style={{ padding: '5px 10px', fontSize: '12px' }}
            title="Clear all filters"
          >
            <X size={13} />
            <span>Clear ({activeFilterCount})</span>
          </button>
        )}

        {/* Total count badge */}
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
          {totalCount} {totalCount === 1 ? 'ticket' : 'tickets'}
        </span>
      </div>

      {/* Search Input */}
      <div className="sub-header-search" style={{ position: 'relative', width: '260px' }}>
        <Search
          size={15}
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          className="text-input"
          placeholder="Search key, title, notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '32px', width: '100%' }}
        />
      </div>
    </div>
  );
}
