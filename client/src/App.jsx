import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import SubHeader from './components/SubHeader';
import KanbanBoard from './components/KanbanBoard';
import BugTrackerView from './components/BugTrackerView';
import TeamDashboard from './components/TeamDashboard';
import ListView from './components/ListView';
import MetricsDashboard from './components/MetricsDashboard';
import AdminConsoleView from './components/AdminConsoleView';
import DeveloperWorkspaceView from './components/DeveloperWorkspaceView';
import QAVerificationView from './components/QAVerificationView';
import NotesView from './components/NotesView';
import IssueModal from './components/IssueModal';
import ProfileModal from './components/ProfileModal';
import UserProfileModal from './components/UserProfileModal';
import BackupModal from './components/BackupModal';

function MainApp() {
  const { 
    isAuthenticated, 
    currentUser, 
    selectedProjectId, 
    projects, 
    apiFetch, 
    showToast,
    loading: authLoading 
  } = useAuth();

  // Navigation & View State
  const [currentTab, setCurrentTab] = useState('kanban');

  // Filter State
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [reporterFilter, setReporterFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const clearAllFilters = () => {
    setTypeFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setSeverityFilter('all');
    setAssigneeFilter('all');
    setReporterFilter('all');
    setDueFilter('all');
    setSearchTerm('');
  };

  // Data State
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [initialIssueType, setInitialIssueType] = useState('task');
  const [initialIssueStatus, setInitialIssueStatus] = useState('backlog');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Set default view tailored to the user's role upon login or role change
  useEffect(() => {
    if (currentUser?.role) {
      switch (currentUser.role) {
        case 'admin':
          setCurrentTab('kanban');
          break;
        case 'pm':
          setCurrentTab('team');
          break;
        case 'developer':
          setCurrentTab('developer');
          break;
        case 'qa':
          setCurrentTab('qa');
          break;
        default:
          setCurrentTab('kanban');
          break;
      }
    }
  }, [currentUser?.role, currentUser?.id]);

  // Load Issues
  const loadIssues = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedProjectId && selectedProjectId !== 'all') {
        params.append('projectId', selectedProjectId);
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (severityFilter !== 'all') {
        params.append('severity', severityFilter);
      }
      if (assigneeFilter !== 'all') {
        params.append('assigneeId', assigneeFilter);
      }
      if (reporterFilter !== 'all') {
        params.append('reporterId', reporterFilter);
      }
      if (dueFilter !== 'all') {
        params.append('dueFilter', dueFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const res = await fetch(`/api/issues?${params.toString()}`);
      const data = await res.json();
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, typeFilter, priorityFilter, statusFilter, severityFilter, assigneeFilter, reporterFilter, dueFilter, searchTerm]);

  useEffect(() => {
    if (isAuthenticated) {
      loadIssues();
    }
  }, [isAuthenticated, loadIssues]);

  // Move issue status (Kanban or Quick Actions)
  const handleMoveStatus = async (issueId, newStatus) => {
    try {
      await apiFetch(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Moved ${issueId} to ${newStatus.replace('_', ' ')}`, 'success');
      loadIssues();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Save issue (Create or Edit)
  const handleSaveIssue = async (payload, issueId) => {
    try {
      if (issueId) {
        await apiFetch(`/api/issues/${issueId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast(`Updated ticket [${issueId}]`, 'success');
      } else {
        const created = await apiFetch('/api/issues', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast(`Created ${created.type} [${created.id}]`, 'success');
      }
      setIsIssueModalOpen(false);
      setSelectedIssue(null);
      loadIssues();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete issue
  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm(`Are you sure you want to delete ticket ${issueId}?`)) return;

    try {
      await apiFetch(`/api/issues/${issueId}`, {
        method: 'DELETE'
      });
      showToast(`Deleted ticket ${issueId}`, 'success');
      setIsIssueModalOpen(false);
      setSelectedIssue(null);
      loadIssues();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenNewTicket = (type = 'task', status = 'backlog') => {
    setSelectedIssue(null);
    setInitialIssueType(type);
    setInitialIssueStatus(status);
    setIsIssueModalOpen(true);
  };

  const handleOpenNewBug = () => {
    handleOpenNewTicket('bug', 'todo');
  };

  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
    setIsIssueModalOpen(true);
  };

  // If loading session
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>
        Loading HyperTrack workspace...
      </div>
    );
  }

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Determine if the shared issue filter bar should show (all issue-based views)
  const showSubHeader = ['kanban', 'bugs', 'list', 'metrics', 'developer', 'qa'].includes(currentTab);

  return (
    <div className="app-layout">
      {/* Vertical Navigation Sidebar (Desktop sticky + Mobile topbar/drawer) */}
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewTicket={() => handleOpenNewTicket('task', 'backlog')}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenEditProfile={() => setIsUserProfileModalOpen(true)}
      />

      {/* Main Workspace Viewport Area */}
      <div className="app-main-area">
        {/* Sub Header Bar with Quick Filters */}
        {showSubHeader && (
          <SubHeader
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            severityFilter={severityFilter}
            setSeverityFilter={setSeverityFilter}
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            reporterFilter={reporterFilter}
            setReporterFilter={setReporterFilter}
            dueFilter={dueFilter}
            setDueFilter={setDueFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onClearAll={clearAllFilters}
            totalCount={issues.length}
          />
        )}

        {/* Main Role-Adaptive Viewport Content */}
        <main className="main-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Loading tickets...
            </div>
          ) : (
            <>
              {/* 1. Kanban Board View */}
              {currentTab === 'kanban' && (
                <KanbanBoard 
                  issues={issues}
                  onMoveStatus={handleMoveStatus}
                  onSelectIssue={handleSelectIssue}
                  onQuickAdd={(status) => handleOpenNewTicket('task', status)}
                />
              )}

            {/* 2. Bug Tracker Triage View */}
            {currentTab === 'bugs' && (
              <BugTrackerView 
                bugs={issues.filter(i => i.type === 'bug')}
                onSelectIssue={handleSelectIssue}
                onMoveStatus={handleMoveStatus}
                onOpenNewBug={handleOpenNewBug}
              />
            )}

            {/* 3. Team Capacity & Roadmap View (Default for Manager/PM) */}
            {currentTab === 'team' && (
              <TeamDashboard 
                onOpenNewProfile={() => setIsProfileModalOpen(true)}
              />
            )}

            {/* 4. Developer Focus Workspace (Default for Developer) */}
            {currentTab === 'developer' && (
              <DeveloperWorkspaceView 
                issues={issues}
                onMoveStatus={handleMoveStatus}
                onSelectIssue={handleSelectIssue}
                onSwitchToKanban={() => setCurrentTab('kanban')}
              />
            )}

            {/* 5. QA Verification & Test Workbench (Default for QA) */}
            {currentTab === 'qa' && (
              <QAVerificationView 
                issues={issues}
                onMoveStatus={handleMoveStatus}
                onSelectIssue={handleSelectIssue}
                onOpenNewBug={handleOpenNewBug}
              />
            )}

            {/* 6. Admin Control Console (Exclusive for Admin) */}
            {currentTab === 'admin_console' && (
              <AdminConsoleView 
                onOpenNewProfile={() => setIsProfileModalOpen(true)}
                onOpenBackup={() => setIsBackupModalOpen(true)}
              />
            )}

            {/* 7. List Tabular View */}
            {currentTab === 'list' && (
              <ListView 
                issues={issues}
                onSelectIssue={handleSelectIssue}
              />
            )}

            {/* 8. Metrics View */}
            {currentTab === 'metrics' && (
              <MetricsDashboard
                issues={issues}
                projects={projects}
              />
            )}

            {/* 9. Notes View */}
            {currentTab === 'notes' && (
              <NotesView />
            )}
          </>
        )}
        </main>
      </div>

      {/* Modals */}
      <IssueModal 
        issue={selectedIssue}
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setSelectedIssue(null);
        }}
        onSave={handleSaveIssue}
        onDelete={handleDeleteIssue}
        initialType={initialIssueType}
        initialStatus={initialIssueStatus}
      />

      {/* Admin Create Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileCreated={() => {
          loadIssues();
        }}
      />

      {/* User Self-Service Profile & Password Modal */}
      <UserProfileModal 
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
      />

      {/* Database Backup Modal */}
      <BackupModal 
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshData={() => {
          loadIssues();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
