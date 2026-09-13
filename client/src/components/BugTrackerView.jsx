import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertOctagon, 
  Flame, 
  CheckCircle2, 
  RotateCcw, 
  Plus, 
  Monitor, 
  Terminal,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export default function BugTrackerView({ 
  bugs, 
  onSelectIssue, 
  onMoveStatus, 
  onOpenNewBug 
}) {
  const { can, currentUser } = useAuth();
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredBugs = bugs.filter(b => {
    if (severityFilter === 'all') return true;
    return b.severity === severityFilter;
  });

  const blockerCount = bugs.filter(b => b.severity === 'blocker' && b.status !== 'done').length;
  const criticalCount = bugs.filter(b => b.severity === 'critical' && b.status !== 'done').length;

  return (
    <div className="bug-triage-container">
      {/* Alert Banner for Blockers */}
      {(blockerCount > 0 || criticalCount > 0) && (
        <div className="blocker-alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#dc2626', borderRadius: '50%', padding: '6px', color: 'white' }}>
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px', color: '#fca5a5' }}>
                High Priority Bug Triage Required
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                There are currently <strong>{blockerCount} Blocker(s)</strong> and <strong>{criticalCount} Critical bug(s)</strong> affecting active releases.
              </div>
            </div>
          </div>
          {(can('report_bug') || can('create_issue')) && (
            <button className="btn btn-primary" onClick={onOpenNewBug}>
              <Plus size={16} />
              <span>Log Bug</span>
            </button>
          )}
        </div>
      )}

      {/* Severity Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="severity-pills-row" style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Bugs', count: bugs.length },
            { id: 'blocker', label: 'Blockers', count: bugs.filter(b => b.severity === 'blocker').length },
            { id: 'critical', label: 'Critical', count: bugs.filter(b => b.severity === 'critical').length },
            { id: 'major', label: 'Major', count: bugs.filter(b => b.severity === 'major').length },
            { id: 'minor', label: 'Minor', count: bugs.filter(b => b.severity === 'minor').length }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setSeverityFilter(pill.id)}
              className={`btn ${severityFilter === pill.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-full)', flexShrink: 0 }}
            >
              <span>{pill.label}</span>
              <span style={{ 
                background: 'rgba(255,255,255,0.15)', 
                padding: '1px 6px', 
                borderRadius: '99px',
                fontSize: '10px'
              }}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {(can('report_bug') || can('create_issue')) && !blockerCount && !criticalCount && (
          <button className="btn btn-primary" onClick={onOpenNewBug}>
            <Plus size={16} />
            <span>Log Bug</span>
          </button>
        )}
      </div>

      {/* Bugs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredBugs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={40} style={{ margin: '0 auto 12px', color: '#10b981' }} />
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              No bugs matching this severity filter!
            </div>
            <div style={{ fontSize: '13px' }}>All systems operational in this category.</div>
          </div>
        ) : (
          filteredBugs.map(bug => (
            <div 
              key={bug.id} 
              className="bug-card-row"
              onClick={() => onSelectIssue(bug)}
            >
              {/* Top Row: Key, Title, Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="ticket-id">{bug.id}</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {bug.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge severity-${bug.severity}`}>
                    {bug.severity}
                  </span>
                  <span className={`badge`} style={{ background: 'rgba(255,255,255,0.08)' }}>
                    Status: {bug.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Bug Reproduction / Environment Snippet */}
              {bug.reproduction_steps && (
                <div className="bug-repro-box">
                  <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={13} color="var(--primary)" />
                    <span>Steps to Reproduce:</span>
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {bug.reproduction_steps}
                  </pre>
                </div>
              )}

              {/* Bottom Meta & Quick Resolution Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
                  {bug.environment && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Monitor size={13} />
                      {bug.environment}
                    </span>
                  )}
                  {bug.reporter_name && (
                    <span>Reported by: <strong>{bug.reporter_name}</strong></span>
                  )}
                  {bug.assignee_name ? (
                    <span>Assigned to: <strong>{bug.assignee_name}</strong></span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </div>

                {/* Workflow Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  {bug.status !== 'done' && can('move_issue') && (
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => onMoveStatus(bug.id, 'done')}
                    >
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>Mark Fixed</span>
                    </button>
                  )}
                  {bug.status === 'done' && can('verify_bug') && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600, fontSize: '12px' }}>
                      <CheckCircle2 size={14} />
                      Verified
                    </span>
                  )}
                  {bug.status === 'done' && can('move_issue') && (
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => onMoveStatus(bug.id, 'in_progress')}
                    >
                      <RotateCcw size={12} />
                      <span>Reopen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
