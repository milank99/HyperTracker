import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, FolderKanban, Filter, AlertCircle } from 'lucide-react';

export default function SubHeader({
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  searchTerm,
  setSearchTerm,
  totalCount
}) {
  const { projects, selectedProjectId, setSelectedProjectId } = useAuth();

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
