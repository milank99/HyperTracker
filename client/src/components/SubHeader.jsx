import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, FolderKanban, X } from 'lucide-react';

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
  searchTerm,
  setSearchTerm,
  onClearAll,
  totalCount
}) {
  const { projects, selectedProjectId, setSelectedProjectId, users } = useAuth();

  const activeFilterCount = [
    typeFilter, priorityFilter, statusFilter, severityFilter, assigneeFilter, reporterFilter, dueFilter
  ].filter(f => f !== 'all').length + (searchTerm.trim() ? 1 : 0);

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
