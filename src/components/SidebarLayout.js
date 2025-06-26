import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CreditCard, CalendarCheck, Settings } from 'lucide-react';
import './SidebarLayout.css';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { to: '/members', label: 'Members', icon: <Users size={20} /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard size={20} /> },
  { to: '/attendance', label: 'Attendance', icon: <CalendarCheck size={20} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

const SidebarLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={`sidebar-layout${collapsed ? ' collapsed' : ''}`}> 
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">🏋️</span>
          {!collapsed && <span className="sidebar-title">Gym Admin</span>}
        </div>
        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link${location.pathname.startsWith(link.to) ? ' active' : ''}`}
            >
              {link.icon}
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>
        </button>
      </aside>
      <main className="main-content">
        <header className="main-header">
          {/* You can add a dynamic page title here if desired */}
        </header>
        <div className="main-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout; 