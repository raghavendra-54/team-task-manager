import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, User, ChevronDown } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="page-layout">
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>TaskFlow</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Team Manager</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavLink to="/dashboard" style={({ isActive }) => navStyle(isActive)}>
            <LayoutDashboard size={17} />
            Dashboard
          </NavLink>
          <NavLink to="/projects" style={({ isActive }) => navStyle(isActive)}>
            <FolderKanban size={17} />
            Projects
          </NavLink>
        </nav>

        {/* User */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: showUserMenu ? 'var(--bg-hover)' : 'transparent',
              border: '1px solid transparent', cursor: 'pointer',
              transition: 'all 0.2s', color: 'var(--text)'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '1px solid rgba(124,106,245,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', flexShrink: 0
            }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', 
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {showUserMenu && (
            <div style={{
              marginTop: 6, background: 'var(--bg)',
              border: '1px solid var(--border-light)', borderRadius: 10,
              overflow: 'hidden', animation: 'fadeIn 0.15s ease'
            }}>
              <button onClick={handleLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'transparent',
                color: 'var(--red)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: 'none', transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function navStyle(isActive) {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500,
    transition: 'all 0.15s', textDecoration: 'none',
    color: isActive ? 'white' : 'var(--text-dim)',
    background: isActive ? 'var(--accent)' : 'transparent',
    boxShadow: isActive ? '0 2px 12px rgba(124,106,245,0.3)' : 'none',
  };
}
