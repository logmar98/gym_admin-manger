import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    stoppedMembers: 0,
    bannedMembers: 0,
    todayAttendance: 0,
    monthlyRevenue: 0,
    pendingPayments: 0
  });
  const [attendanceTrend, setAttendanceTrend] = useState([]); // [{date, count}]

  useEffect(() => {
    fetchDashboardStats();
    fetchAttendanceTrend();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const totalMembers = membersSnapshot.size;
      const activeMembers = membersSnapshot.docs.filter(doc => doc.data().status === 'active').length;
      const stoppedMembers = membersSnapshot.docs.filter(doc => doc.data().status === 'stopped').length;
      const bannedMembers = membersSnapshot.docs.filter(doc => doc.data().status === 'banned').length;
      const today = dayjs().format('YYYY-MM-DD');
      const logsSnapshot = await getDocs(
        query(collection(db, 'logs'), where('date', '==', today))
      );
      const todayAttendance = logsSnapshot.size;
      const monthlyRevenue = totalMembers * 50;
      const pendingPayments = Math.floor(totalMembers * 0.2);
      setStats({
        totalMembers,
        activeMembers,
        stoppedMembers,
        bannedMembers,
        todayAttendance,
        monthlyRevenue,
        pendingPayments
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchAttendanceTrend = async () => {
    try {
      const trend = [];
      let max = 1;
      for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        const logsSnapshot = await getDocs(
          query(collection(db, 'logs'), where('date', '==', date))
        );
        const count = logsSnapshot.size;
        if (count > max) max = count;
        trend.push({ date, count });
      }
      setAttendanceTrend(trend.map(d => ({ ...d, max })));
    } catch (error) {
      console.error('Error fetching attendance trend:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  // For attendance trend
  const weekDays = attendanceTrend.map(d => dayjs(d.date).format('ddd'));
  const maxAttendance = attendanceTrend.length > 0 ? Math.max(...attendanceTrend.map(d => d.count), 1) : 1;

  // For member status
  const { activeMembers, stoppedMembers, bannedMembers, totalMembers } = stats;
  const activePct = totalMembers ? Math.round((activeMembers / totalMembers) * 100) : 0;
  const stoppedPct = totalMembers ? Math.round((stoppedMembers / totalMembers) * 100) : 0;
  const bannedPct = totalMembers ? Math.round((bannedMembers / totalMembers) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to your gym management dashboard</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon="👥"
          color="#0d6efd"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          icon="✅"
          color="#198754"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon="📊"
          color="#ffc107"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue}`}
          icon="💰"
          color="#dc3545"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon="⏳"
          color="#6f42c1"
        />
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Attendance Trend (Last 7 Days)</h3>
          <div className="chart-placeholder real-bar-chart">
            {attendanceTrend.map((d, i) => {
              let barHeight;
              if (d.count === 0) {
                barHeight = '8px';
              } else {
                const maxBarHeight = 180; // px, leave some space for labels
                const heightPx = Math.max((d.count / maxAttendance) * maxBarHeight, 18); // at least 18px
                barHeight = `${heightPx}px`;
              }
              return (
                <div key={d.date} className="chart-bar-wrapper">
                  <div
                    className="chart-bar-real"
                    style={{ height: barHeight }}
                    title={`${d.count} check-ins`}
                  >
                    {d.count > 0 && <span className="bar-label">{d.count}</span>}
                  </div>
                  <span className="chart-bar-day">{weekDays[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <h3>Member Status Distribution</h3>
          <div className="member-status-bar">
            <div className="status-segment active" style={{ width: `${activePct}%` }} title={`Active: ${activeMembers}`}>{activeMembers > 0 && <span>{activeMembers}</span>}</div>
            <div className="status-segment stopped" style={{ width: `${stoppedPct}%` }} title={`Stopped: ${stoppedMembers}`}>{stoppedMembers > 0 && <span>{stoppedMembers}</span>}</div>
            <div className="status-segment banned" style={{ width: `${bannedPct}%` }} title={`Banned: ${bannedMembers}`}>{bannedMembers > 0 && <span>{bannedMembers}</span>}</div>
          </div>
          <div className="status-labels">
            <span className="active">Active ({activePct}%)</span>
            <span className="stopped">Stopped ({stoppedPct}%)</span>
            <span className="banned">Banned ({bannedPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 