import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import SidebarLayout from './components/SidebarLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import Payments from './pages/Payments';
import Attendance from './pages/Attendance';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="github-loading-dark">
        <div className="loading-spinner" aria-label="Loading" />
        <div className="github-loading-text">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <Router>
    <div className="App">
        {user ? (
          <SidebarLayout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/member/:memberId" element={<MemberProfile />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SidebarLayout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
    </div>
    </Router>
  );
}

export default App;
