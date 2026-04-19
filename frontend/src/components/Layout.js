import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconProjects = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-dot" />
          PROJECTFLOW
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <IconDashboard /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <IconProjects /> Projects
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {/* Socket connection indicator */}
          <div style={{ padding: '6px 12px 2px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: connected ? 'var(--green)' : 'var(--overlay0)',
              animation: connected ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.72rem', color: connected ? 'var(--green)' : 'var(--overlay1)', fontWeight: 600 }}>
              {connected ? 'Real-time on' : 'Connecting…'}
            </span>
          </div>

          <div className="user-badge">
            <div className="avatar">{getInitials(user?.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name truncate">{user?.name}</div>
              <div className="user-email truncate">{user?.email}</div>
            </div>
          </div>
          <button className="nav-item btn-ghost" onClick={handleLogout} style={{ marginTop: 4 }}>
            <IconLogout /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
