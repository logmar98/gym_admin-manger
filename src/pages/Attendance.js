import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import './Attendance.css';
import { QrReader } from '@blackbox-vision/react-qr-reader';

const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // default to today
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrError, setQRError] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    fetchAttendanceLogs();
    fetchMembers();
  }, []);

  const fetchAttendanceLogs = async () => {
    try {
      const logsQuery = query(
        collection(db, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const logsSnapshot = await getDocs(logsQuery);
      
      const logsData = [];
      for (const logDoc of logsSnapshot.docs) {
        const logData = logDoc.data();
        // Fetch member details for each log
        const memberDoc = await getDocs(
          query(collection(db, 'members'), 
          where('__name__', '==', logData.memberId))
        );
        const memberData = memberDoc.docs[0]?.data();
        
        logsData.push({
          id: logDoc.id,
          ...logData,
          memberName: memberData?.name || 'Unknown Member',
          memberEmail: memberData?.email || 'No Email'
        });
      }
      
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'members'));
      const membersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const getFilteredLogs = () => {
    const now = dayjs();
    
    switch (filter) {
      case 'today':
        return logs.filter(log => 
          dayjs(log.timestamp?.toDate()).isSame(now, 'day')
        );
      case 'week':
        return logs.filter(log => 
          dayjs(log.timestamp?.toDate()).isSame(now, 'week')
        );
      case 'month':
        return logs.filter(log => 
          dayjs(log.timestamp?.toDate()).isSame(now, 'month')
        );
      default:
        return logs;
    }
  };

  const exportAttendanceCSV = () => {
    const filteredLogs = getFilteredLogs();
    const headers = ['Date', 'Time', 'Member Name', 'Member Email', 'Member ID'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        dayjs(log.timestamp?.toDate()).format('MMM DD, YYYY'),
        dayjs(log.timestamp?.toDate()).format('HH:mm:ss'),
        log.memberName,
        log.memberEmail,
        log.memberId
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${filter}-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceStats = () => {
    const today = dayjs();
    const todayLogs = logs.filter(log => 
      dayjs(log.timestamp?.toDate()).isSame(today, 'day')
    );
    const weekLogs = logs.filter(log => 
      dayjs(log.timestamp?.toDate()).isSame(today, 'week')
    );
    const monthLogs = logs.filter(log => 
      dayjs(log.timestamp?.toDate()).isSame(today, 'month')
    );

    return {
      today: todayLogs.length,
      week: weekLogs.length,
      month: monthLogs.length,
      total: logs.length
    };
  };

  const handleScan = async (data) => {
    if (data) {
      setShowQRModal(false);
      setQRError('');
      await addAttendanceByMemberId(data);
    }
  };

  const handleError = (err) => {
    setQRError('QR Scan Error: ' + err.message);
  };

  const addAttendanceByMemberId = async (memberId) => {
    try {
      await addDoc(collection(db, 'logs'), {
        memberId,
        date: dayjs().format('YYYY-MM-DD'),
        timestamp: new Date()
      });
      fetchAttendanceLogs();
    } catch (error) {
      // Optionally handle error silently or with a UI message
      // console.error('Error adding attendance:', error);
    }
  };

  const handleManualAttendance = async () => {
    if (!selectedMember) return;
    await addAttendanceByMemberId(selectedMember.id);
    setSelectedMember(null);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  if (loading) {
    return <div className="loading">Loading attendance logs...</div>;
  }

  const filteredLogs = getFilteredLogs();
  const stats = getAttendanceStats();

  return (
    <>
      <div className="main-header">
        <h1>Attendance Log</h1>
      </div>
      <div className="main-inner">
        <div className="card">
          <div className="page-header">
            <div className="header-actions">
              <div className="attendance-header-left">
                <div className="attendance-actions-group">
                  <div className="attendance-search-box">
                    <input
                      type="text"
                      placeholder="Search member by name or email"
                      value={selectedMember ? selectedMember.name + ' (' + selectedMember.email + ')' : searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setSelectedMember(null);
                        setShowSearchDropdown(true);
                      }}
                      onFocus={() => setShowSearchDropdown(true)}
                      className="attendance-search-input"
                      autoComplete="off"
                    />
                    {showSearchDropdown && !selectedMember && searchTerm && (
                      <div className="attendance-search-dropdown">
                        {members.filter(m =>
                          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.email.toLowerCase().includes(searchTerm.toLowerCase())
                        ).slice(0, 10).map(m => (
                          <div
                            key={m.id}
                            className="attendance-search-result"
                            onClick={() => {
                              setSelectedMember(m);
                              setShowSearchDropdown(false);
                            }}
                            onMouseDown={e => e.preventDefault()}
                          >
                            {m.name} <span className="attendance-search-email">({m.email})</span>
                          </div>
                        ))}
                        {members.filter(m =>
                          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.email.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="attendance-search-no-results">No results</div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleManualAttendance}
                    className="add-attendance-btn"
                    disabled={!selectedMember}
                  >
                    Add Attendance
                  </button>
                  <button onClick={() => setShowQRModal(true)} className="export-btn">Scan QR</button>
                </div>
              </div>
              <button onClick={exportAttendanceCSV} className="export-btn export-btn-right">
                📊 Export CSV
              </button>
            </div>
          </div>

          {/* QR Modal */}
          {showQRModal && (
            <div className="qr-modal">
              <div className="qr-content">
                <h3>Scan Member QR Code</h3>
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={(result, error) => {
                    if (!!result) handleScan(result?.text);
                    if (!!error) handleError(error);
                  }}
                  style={{ width: '100%' }}
                />
                {qrError && <div style={{ color: 'red', marginTop: 8 }}>{qrError}</div>}
                <button onClick={() => setShowQRModal(false)} className="close-btn" style={{ marginTop: 16 }}>Close</button>
              </div>
            </div>
          )}

          {/* Overview Cards as Filters */}
          <div className="attendance-overview">
            <div
              className={`overview-card${filter === 'today' ? ' active' : ''}`}
              onClick={() => setFilter('today')}
              style={{ cursor: 'pointer' }}
            >
              <h3>Today</h3>
              <div className="overview-value">{stats.today}</div>
              <div className="overview-label">Check-ins today</div>
            </div>
            <div
              className={`overview-card${filter === 'week' ? ' active' : ''}`}
              onClick={() => setFilter('week')}
              style={{ cursor: 'pointer' }}
            >
              <h3>This Week</h3>
              <div className="overview-value">{stats.week}</div>
              <div className="overview-label">Check-ins this week</div>
            </div>
            <div
              className={`overview-card${filter === 'month' ? ' active' : ''}`}
              onClick={() => setFilter('month')}
              style={{ cursor: 'pointer' }}
            >
              <h3>This Month</h3>
              <div className="overview-value">{stats.month}</div>
              <div className="overview-label">Check-ins this month</div>
            </div>
            <div
              className={`overview-card${filter === 'all' ? ' active' : ''}`}
              onClick={() => setFilter('all')}
              style={{ cursor: 'pointer' }}
            >
              <h3>All Time</h3>
              <div className="overview-value">{stats.total}</div>
              <div className="overview-label">Total check-ins</div>
            </div>
          </div>

          <div className="attendance-section">
            <h2>Attendance Records ({filteredLogs.length})</h2>
            <div className="table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Member Name</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <span className="member-id">{log.memberId}</span>
                      </td>
                      <td>
                        <div className="member-info">
                          <span className="member-name">{log.memberName}</span>
                        </div>
                      </td>
                      <td>{log.memberEmail}</td>
                      <td>
                        <div className="date-info">
                          <span className="date">
                            {dayjs(log.timestamp?.toDate()).format('MMM DD, YYYY')}
                          </span>
                          <span className="day">
                            {dayjs(log.timestamp?.toDate()).format('dddd')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="time">
                          {dayjs(log.timestamp?.toDate()).format('HH:mm:ss')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="no-records">
                <p>No attendance records found for the selected filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Attendance; 