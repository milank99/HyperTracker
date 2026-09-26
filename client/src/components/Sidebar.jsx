import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Kanban, 
  Bug, 
  Users, 
  List, 
  BarChart3, 
  Plus, 
  Database, 
  ChevronDown, 
  Check,
  Shield, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Sparkles, 
  Code, 
  LogOut, 
  Settings, 
  KeyRound,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  StickyNote
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  onOpenNewTicket, 
  onOpenBackup,
  onOpenEditProfile
}) {
  const { currentUser, logout, can, theme, toggleTheme, projects, selectedProjectId } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Compute tabs dynamically according to user profile / role
  const getTabsForRole = (role) => {
    switch (role) {
      case 'admin':
        return [
          { id: 'kanban', label: 'Kanban Board', icon: Kanban },
          { id: 'bugs', label: 'Bug Tracker', icon: Bug },
          { id: 'team', label: 'Team Capacity', icon: Users },
          { id: 'admin_console', label: 'Admin Console', icon: Shield },
          { id: 'metrics', label: 'Metrics & Analytics', icon: BarChart3 }
        ];
      case 'pm':
        return [
          { id: 'team', label: 'Roadmap & Capacity', icon: Users },
          { id: 'kanban', label: 'Sprint Kanban', icon: Kanban },
          { id: 'bugs', label: 'Bug Triage', icon: Bug },
          { id: 'metrics', label: 'Metrics & Analytics', icon: BarChart3 }
        ];
      case 'developer':
        return [
          { id: 'developer', label: 'My Focus Work', icon: Code },
          { id: 'kanban', label: 'Team Kanban', icon: Kanban },
          { id: 'bugs', label: 'Defects & Bugs', icon: Bug }
        ];
      case 'qa':
        return [
          { id: 'qa', label: 'QA Verification', icon: ShieldCheck },
          { id: 'bugs', label: 'Bug Tracker', icon: Bug },
          { id: 'kanban', label: 'Team Kanban', icon: Kanban }
        ];
      case 'viewer':
      default:
        return [
          { id: 'kanban', label: 'Kanban Board', icon: Kanban },
          { id: 'bugs', label: 'Bug Tracker', icon: Bug },
          { id: 'metrics', label: 'Metrics', icon: BarChart3 }
        ];
    }
  };

  const tabs = [
    ...getTabsForRole(currentUser?.role || 'viewer'),
    { id: 'notes', label: 'My Notes', icon: StickyNote }
  ];

  return (
    <>
      {/* 1. Mobile Topbar (Shown on viewport <= 768px) */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-logo" style={{ width: '30px', height: '30px' }}>
            <Sparkles size={16} />
          </div>
          <div>
            <span className="brand-title" style={{ fontSize: '18px' }}>HyperTrack</span>
            <span className="brand-badge" style={{ marginLeft: '8px' }}>
              {currentUser?.role ? currentUser.role.toUpperCase() : 'APP'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick theme toggle */}
          <button 
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '6px 8px' }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={15} color="#475569" /> : <Sun size={15} color="#f59e0b" />}
          </button>

          {/* Quick New Ticket */}
          {(can('create_issue') || can('report_bug')) && (
            <button 
              className="btn btn-primary"
              onClick={onOpenNewTicket}
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              <Plus size={15} />
              <span>Ticket</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Desktop Vertical Navigation Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header: Logo, App Title & Collapse Button */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo">
              <Sparkles size={18} />
            </div>
            <div className="sidebar-brand-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="brand-title" style={{ fontSize: '19px' }}>HyperTrack</span>
                <span className="brand-badge">{currentUser?.role ? currentUser.role.toUpperCase() : 'APP'}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                <FolderKanban size={10} color="var(--primary)" />
                {activeProject?.name || 'All Projects'}
              </span>
            </div>
          </div>

          <button 
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Primary Action: Create Ticket */}
        {(can('create_issue') || can('report_bug')) && (
          <div className="sidebar-actions">
            <button 
              className="btn btn-primary sidebar-new-ticket-btn"
              onClick={onOpenNewTicket}
              title="Create New Ticket"
            >
              <Plus size={16} />
              <span>New Ticket</span>
            </button>
          </div>
        )}

        {/* Vertical Navigation Section */}
        <div className="sidebar-nav-section">
          <div className="sidebar-section-label">Workspace Views</div>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(tab.id)}
                title={tab.label}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Tools & Utilities Section */}
          <div className="sidebar-section-label" style={{ marginTop: '12px' }}>Tools</div>
          {can('backup_restore') && (
            <button
              className="sidebar-nav-item"
              onClick={onOpenBackup}
              title="Database Backup & Tools"
            >
              <Database size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>DB Backup</span>
            </button>
          )}

          <button
            className="sidebar-nav-item"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon size={16} color="#475569" style={{ flexShrink: 0 }} />
            ) : (
              <Sun size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            )}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        {/* Sticky Footer: User Profile & Popover */}
        <div className="sidebar-footer" ref={dropdownRef}>
          <button 
            className="sidebar-user-card"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Account Menu"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div 
                className="user-avatar" 
                style={{ backgroundColor: currentUser?.avatar_color || '#D97757' }}
              >
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="user-info" style={{ textAlign: 'left', overflow: 'hidden' }}>
                <span className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.name || 'User'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {currentUser?.title || currentUser?.role}
                </span>
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" className="user-menu-arrow" />
          </button>

          {/* User Popover Menu */}
          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '12px',
                width: isCollapsed ? '240px' : 'calc(100% - 24px)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                zIndex: 100,
                marginBottom: '8px'
              }}
            >
              {/* Profile Details */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {currentUser?.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {currentUser?.email}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>
                  {currentUser?.title || 'Team Member'}
                </div>
              </div>

              {/* Edit Profile Action */}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenEditProfile();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Settings size={14} color="var(--text-muted)" />
                <span>Edit Profile & Password</span>
              </button>

              {/* Sign Out Button */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '6px', paddingTop: '6px' }}>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: '#9E2B20',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(158, 43, 32, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 3. Mobile Navigation Drawer (when opened on small screen) */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-drawer-backdrop" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="mobile-drawer">
            {/* Drawer Header with User Profile */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  className="user-avatar" 
                  style={{ backgroundColor: currentUser?.avatar_color || '#D97757', width: '32px', height: '32px' }}
                >
                  {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {currentUser?.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {currentUser?.title || currentUser?.role}
                  </div>
                </div>
              </div>

              <button
                className="btn-icon-sm"
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Navigation Body */}
            <div className="mobile-drawer-body">
              {/* Primary Action */}
              {(can('create_issue') || can('report_bug')) && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenNewTicket();
                  }}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  <Plus size={16} />
                  <span>New Ticket</span>
                </button>
              )}

              {/* View Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '4px' }}>
                  Workspace Views
                </div>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tools & Account */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '4px' }}>
                  Account & Settings
                </div>

                <button
                  className="mobile-nav-item"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenEditProfile();
                  }}
                >
                  <Settings size={18} color="var(--text-muted)" />
                  <span>Edit Profile & Password</span>
                </button>

                {can('backup_restore') && (
                  <button
                    className="mobile-nav-item"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenBackup();
                    }}
                  >
                    <Database size={18} color="var(--primary)" />
                    <span>Database Backup</span>
                  </button>
                )}

                <button
                  className="mobile-nav-item"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? <Moon size={18} color="#475569" /> : <Sun size={18} color="#f59e0b" />}
                  <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
                </button>
              </div>

              {/* Sign Out */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="mobile-nav-item"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  style={{ color: '#9E2B20' }}
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
