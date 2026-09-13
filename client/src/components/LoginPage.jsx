import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, showToast } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('Please enter both username/email and password.', 'error');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
    } catch (err) {
      showToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D97757 0%, #C15C3D 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 14px rgba(217, 119, 87, 0.35)'
          }}>
            <Sparkles size={24} />
          </div>
          <h1 style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 'clamp(24px, 6vw, 30px)',
            fontWeight: '600',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            HyperTrack Workspace
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Sign in to access your project management and bug tracking workspace.
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(20px, 5vw, 32px)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} color="var(--primary)" />
                <span>Username or Work Email</span>
              </label>
              <input
                type="text"
                className="text-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} color="var(--primary)" />
                <span>Password</span>
              </label>
              <input
                type="password"
                className="text-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '11px', marginTop: '6px', fontSize: '14px', justifyContent: 'center' }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Secure Environment Note */}
          <div style={{
            marginTop: '20px',
            padding: '10px 12px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <Shield size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>Secure workspace login with TLS encryption.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
