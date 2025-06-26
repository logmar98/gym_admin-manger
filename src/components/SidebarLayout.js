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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on link click (mobile)
  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  // Close sidebar when clicking outside (mobile)
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('sidebar-overlay')) {
      setMobileOpen(false);
    }
  };

  return (
    <div className={`sidebar-layout${collapsed ? ' collapsed' : ''}`}> 
      {/* Mobile hamburger menu */}
      <div className="mobile-header">
        <span className="sidebar-logo">🏋️</span>
        <button className="mobile-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {/* Sidebar overlay for mobile */}
      {(mobileOpen) && <div className="sidebar-overlay" onClick={handleOverlayClick}></div>}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}> 
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
              onClick={handleLinkClick}
            >
              {link.icon}
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
          {collapsed ? (
            // Chevron right icon
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          ) : (
            // Chevron left icon
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          )}
        </button>
      </aside>
      <main className="main-content">
      
        <div className="main-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout; 