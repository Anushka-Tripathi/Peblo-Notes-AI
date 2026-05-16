import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, LayoutDashboard, Archive, LogOut, Plus,
  ChevronLeft, ChevronRight, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Layout.css';

export default function AppLayout({ children, onNewNote }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: FileText, label: 'Notes', end: true },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/archived', icon: Archive, label: 'Archived' },
  ];

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Star size={18} color="var(--amber)" fill="var(--amber)" />
            {!collapsed && <span className="sidebar-logo-text">Peblo Notes</span>}
          </div>
          <button className="btn btn-ghost btn-icon sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!collapsed && (
          <button className="btn btn-primary new-note-btn" onClick={onNewNote}>
            <Plus size={15} />
            New Note
          </button>
        )}
        {collapsed && (
          <button className="btn btn-primary btn-icon new-note-btn-icon" onClick={onNewNote}>
            <Plus size={16} />
          </button>
        )}

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-icon logout-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
