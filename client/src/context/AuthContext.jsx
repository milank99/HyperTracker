import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users', 'change_roles', 'admin_console', 'reset_passwords',
    'create_project', 'edit_project', 'delete_project', 'create_issue', 'edit_issue',
    'delete_issue', 'move_issue', 'assign_issue', 'verify_bug', 'comment',
    'backup_restore', 'view_all'
  ],
  pm: [
    'create_project', 'edit_project', 'create_issue', 'edit_issue', 'delete_issue',
    'move_issue', 'assign_issue', 'comment', 'view_all'
  ],
  developer: [
    'create_issue', 'edit_issue', 'move_issue', 'comment', 'view_all'
  ],
  qa: [
    'create_issue', 'report_bug', 'verify_bug', 'move_issue', 'edit_issue',
    'comment', 'view_all'
  ],
  viewer: [
    'view_all'
  ]
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hypertrack_token') || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('hypertrack_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hypertrack_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Authenticated fetch wrapper
  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (currentUser?.id) {
      headers['x-user-id'] = currentUser.id;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  };

  // Load current authenticated user profile
  const checkAuth = async () => {
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      } else {
        // Token expired or invalid
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('hypertrack_token');
      }
    } catch (err) {
      console.error('Failed to check auth:', err);
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('hypertrack_token');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([checkAuth(), loadUsers(), loadProjects()]);
      setLoading(false);
    }
    init();
  }, [token]);

  // Login handler
  const login = async (identifier, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, username: identifier, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setCurrentUser(data.user);
    localStorage.setItem('hypertrack_token', data.token);
    showToast(`Welcome back, ${data.user.name}! (${data.user.role.toUpperCase()})`, 'success');
    return data.user;
  };

  // Logout handler
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('hypertrack_token');
      showToast('You have been signed out.', 'info');
    }
  };

  // Update Profile
  const updateProfile = async (formData) => {
    const updated = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(formData)
    });
    setCurrentUser(updated);
    showToast('Profile updated successfully!', 'success');
    loadUsers();
    return updated;
  };

  // Change Password
  const changePassword = async (currentPassword, newPassword) => {
    await apiFetch('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    showToast('Password changed successfully!', 'success');
  };

  // Quick switch for demo purposes (logs in as chosen user)
  const quickSwitchUser = async (targetUser) => {
    try {
      await login(targetUser.email, 'password123');
    } catch (err) {
      // Fallback
      setCurrentUser(targetUser);
      showToast(`Switched active view to ${targetUser.name}`, 'info');
    }
  };

  const can = (permission) => {
    if (!currentUser) return false;
    const permissions = ROLE_PERMISSIONS[currentUser.role] || [];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      token,
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      logout,
      updateProfile,
      changePassword,
      quickSwitchUser,
      users,
      projects,
      selectedProjectId,
      setSelectedProjectId,
      can,
      apiFetch,
      refreshUsers: loadUsers,
      refreshProjects: loadProjects,
      showToast,
      loading,
      theme,
      toggleTheme
    }}>
      {children}
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
