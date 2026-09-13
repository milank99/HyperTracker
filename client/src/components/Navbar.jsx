import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Kanban, 
  Bug, 
  Users, 
  List, 
  BarChart3, 
  Plus, 
  UserPlus, 
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
  X
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  onOpenNewTicket, 
  onOpenNewProfile, 
  onOpenBackup,
  onOpenEditProfile
}) {
  const { users, currentUser, quickSwitchUser, logout, can, theme, toggleTheme } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

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
          { id: 'kanban', label: 'Kanban', icon: Kanban },
          { id: 'bugs', label: 'Bug Tracker', icon: Bug },
          { id: 'team', label: 'Team Capacity', icon: Users },
          { id: 'admin_console', label: 'Admin Console', icon: Shield },
          { id: 'metrics', label: 'Metrics', icon: BarChart3 }
        ];
      case 'pm':
        return [
          { id: 'team', label: 'Roadmap & Capacity', icon: Users },
          { id: 'kanban', label: 'Sprint Kanban', icon: Kanban },
          { id: 'bugs', label: 'Bug Triage', icon: Bug },
          { id: 'metrics', label: 'Metrics', icon: BarChart3 }
        ];
      case 'developer':
        return [
          { id: 'developer', label: 'My Focus Work', icon: Code },
          { id: 'kanban', label: 'Team Kanban', icon: Kanban },
          { id: 'bugs', label: 'Bugs', icon: Bug }
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
          { id: 'kanban', label: 'Kanban', icon: Kanban },
          { id: 'bugs', label: 'Bug Tracker', icon: Bug },
          { id: 'metrics', label: 'Metrics', icon: BarChart3 }
        ];
    }
  };

  const tabs = getTabsForRole(currentUser?.role || 'viewer');

  return (
    <header className="navbar">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo">
          <Sparkles size={18} />
        </div>
        <div>
          <span className="brand-title">HyperTrack</span>
          <span className="brand-badge" style={{ marginLeft: '10px' }}>
            {currentUser?.role ? currentUser.role.toUpperCase() : 'APP'}
          </span>
        </div>
      </div>

      {/* Role-Adaptive Tabs */}
      <nav className="nav-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action Controls & Active Profile */}
      <div className="nav-actions">
        {/* Theme Toggle */}
        <button 
          className="btn btn-secondary"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{ padding: '8px 10px' }}
        >
          {theme === 'light' ? <Moon size={15} color="#475569" /> : <Sun size={15} color="#f59e0b" />}
        </button>

        {/* Database Backup (Admin only) */}
        {can('backup_restore') && (
          <button 
            className="btn btn-secondary" 
            onClick={onOpenBackup}
            title="Backup & Restore SQLite Database"
          >
            <Database size={15} />
            <span>DB Backup</span>
          </button>
        )}

        {/* Create Ticket */}
        {(can('create_issue') || can('report_bug')) && (
          <button 
            className="btn btn-primary"
            onClick={onOpenNewTicket}
          >
            <Plus size={16} />
            <span>New Ticket</span>
          </button>
        )}

        {/* Profile Dropdown */}
        <div className="profile-switcher" ref={dropdownRef}>
          <button 
            className="profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Account Menu"
          >
            <div 
              className="user-avatar" 
              style={{ backgroundColor: currentUser?.avatar_color || '#D97757' }}
            >
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser?.name || 'Loading...'}</span>
              <span className={`role-badge role-${currentUser?.role || 'viewer'}`}>
                {currentUser?.role || 'viewer'}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '280px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                zIndex: 100
              }}
            >
              {/* Profile Header */}
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

              {/* Self-service Actions */}
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
                  padding: '7px 10px',
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

              {/* Quick Persona Switcher for local demo */}
              <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border-subtle)', marginTop: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Switch Persona (Demo)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '160px', overflowY: 'auto' }}>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      quickSwitchUser(u);
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: currentUser?.id === u.id ? 'var(--primary-light)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = currentUser?.id === u.id ? 'var(--primary-light)' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div 
                        className="user-avatar" 
                        style={{ backgroundColor: u.avatar_color || '#D97757', width: '20px', height: '20px', fontSize: '10px' }}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: currentUser?.id === u.id ? 700 : 500 }}>{u.name}</span>
                    </div>
                    <span className={`role-badge role-${u.role}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>

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

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
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

              {/* Quick Persona Switcher for mobile demo */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '4px' }}>
                  Switch Profile
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        quickSwitchUser(u.id);
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: currentUser?.id === u.id ? 'var(--bg-subtle)' : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                          className="user-avatar" 
                          style={{ backgroundColor: u.avatar_color, width: '22px', height: '22px', fontSize: '10px' }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: currentUser?.id === u.id ? 600 : 400 }}>{u.name}</span>
                      </div>
                      <span className={`role-badge role-${u.role}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
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
    </header>
  );
}
