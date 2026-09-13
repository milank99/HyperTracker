import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  RotateCcw, 
  Plus, 
  Terminal, 
  Monitor, 
  Clock, 
  Bug, 
  Check, 
  AlertOctagon, 
  MessageSquare 
} from 'lucide-react';

export default function QAVerificationView({ 
  issues, 
  onMoveStatus, 
  onSelectIssue, 
  onOpenNewBug 
}) {
  const { currentUser, showToast } = useAuth();

  // Tickets awaiting QA verification (status = in_review or done recently)
  const awaitingVerification = issues.filter(i => i.status === 'in_review');
  const allBugs = issues.filter(i => i.type === 'bug');
  const openBlockers = allBugs.filter(b => (b.severity === 'blocker' || b.severity === 'critical') && b.status !== 'done');
  const verifiedIssues = issues.filter(i => i.status === 'done');

  const handleVerify = (issueId) => {
    onMoveStatus(issueId, 'done');
    showToast(`Ticket [${issueId}] verified & signed off by QA!`, 'success');
  };

  const handleReopen = (issueId) => {
    onMoveStatus(issueId, 'in_progress');
    showToast(`Ticket [${issueId}] reopened by QA for developer remediation.`, 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* QA Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
              QA Verification & Test Workbench
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Lead QA Tester: <strong>{currentUser.name}</strong>. Verify fixes, triage severity, and sign off sprint releases.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewBug}>
          <Plus size={16} />
          <span>+ File New Defect</span>
        </button>
      </div>

      {/* QA Metrics Row */}
      <div className="team-stats-grid">
        <div className="stat-card primary">
          <span className="stat-label">Awaiting Verification</span>
          <span className="stat-value">{awaitingVerification.length}</span>
          <span className="stat-sub">Ready for test execution</span>
        </div>
        <div className="stat-card rose">
          <span className="stat-label">Critical Blockers</span>
          <span className="stat-value">{openBlockers.length}</span>
          <span className="stat-sub">Release halting defects</span>
        </div>
        <div className="stat-card cyan">
          <span className="stat-label">Total Bugs Logged</span>
          <span className="stat-value">{allBugs.length}</span>
          <span className="stat-sub">Across all projects</span>
        </div>
        <div className="stat-card emerald">
          <span className="stat-label">QA Verified & Signed</span>
          <span className="stat-value">{verifiedIssues.length}</span>
          <span className="stat-sub">Validated fixes</span>
        </div>
      </div>

      {/* Awaiting QA Sign-off Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'Newsreader, Georgia, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Verification Queue (In Review)</span>
            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              {awaitingVerification.length} pending
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Code completed by engineers — awaiting QA verification & sign-off
          </span>
        </div>

        {awaitingVerification.length === 0 ? (
          <div className="workload-matrix-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--accent-sage)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              All caught up! Zero tickets pending QA verification.
            </div>
            <div style={{ fontSize: '12.5px' }}>
              Any tickets moved to "In Review" by developers will appear here for verification.
            </div>
          </div>
        ) : (
          awaitingVerification.map(issue => (
            <div 
              key={issue.id}
              className="bug-card-row"
              onClick={() => onSelectIssue(issue)}
              style={{ borderLeft: '4px solid var(--accent-purple)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="ticket-id">{issue.id}</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {issue.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge badge-${issue.type}`}>{issue.type}</span>
                  {issue.severity && (
                    <span className={`badge severity-${issue.severity}`}>
                      {issue.severity}
                    </span>
                  )}
                  <span className={`priority-${issue.priority}`} style={{ textTransform: 'capitalize', fontSize: '11px', fontWeight: 600 }}>
                    • {issue.priority}
                  </span>
                </div>
              </div>

              {/* Bug Reproduction / Diagnostic Box (if bug) */}
              {issue.reproduction_steps && (
                <div className="bug-repro-box">
                  <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={12} color="var(--primary)" />
                    <span>Reproduction Verification Steps:</span>
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {issue.reproduction_steps}
                  </pre>
                </div>
              )}

              {/* Bottom Meta & Verification Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {issue.assignee_name && (
                    <span>Developer: <strong>{issue.assignee_name}</strong></span>
                  )}
                  {issue.environment && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Monitor size={12} /> {issue.environment}
                    </span>
                  )}
                </div>

                {/* QA Verification Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                    onClick={() => handleReopen(issue.id)}
                    title="Defect persists - return to developer"
                  >
                    <RotateCcw size={13} color="#9E2B20" />
                    <span>Reopen with Defect</span>
                  </button>

                  <button 
                    className="btn btn-primary"
                    style={{ padding: '5px 14px', fontSize: '12px', background: 'var(--accent-sage)' }}
                    onClick={() => handleVerify(issue.id)}
                    title="Sign off fix and mark Done"
                  >
                    <CheckCircle2 size={13} />
                    <span>Verify & Sign Off</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
