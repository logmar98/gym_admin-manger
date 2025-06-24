import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';
import CalendarHeatmap from '../components/CalendarHeatmap';
import './MemberProfile.css';

const MemberProfile = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const memberDoc = await getDoc(doc(db, 'members', memberId));
        if (memberDoc.exists()) {
          setMember({ id: memberDoc.id, ...memberDoc.data() });
        } else {
          navigate('/members');
          return;
        }

        const logsQuery = query(
          collection(db, 'logs'),
          where('memberId', '==', memberId)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const attendanceDates = logsSnapshot.docs.map(doc => doc.data().date);
        setAttendanceData(attendanceDates);
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
  }, [memberId, navigate]);

  const getPaymentStatusColor = (lastPaymentDate, joinDate, joinDay, nextPaymentDate) => {
    if (nextPaymentDate) {
      const now = dayjs();
      const dueDate = dayjs(nextPaymentDate);
      if (now.isBefore(dueDate, 'day')) {
        return 'green';
      } else if (now.isAfter(dueDate, 'day')) {
        const daysLate = now.diff(dueDate, 'day');
        if (daysLate <= 5) return 'yellow';
        if (daysLate > 5 && daysLate <= 15) return 'orange';
        return 'red';
      } else {
        return 'green';
      }
    }
    // If nextPaymentDate is missing, always return red
    return 'red';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: '#27ae60',
      stopped: '#f39c12',
      banned: '#e74c3c'
    };
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: statusColors[status] || '#666' }}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading member profile...</div>;
  }

  if (!member) {
    return <div className="error">Member not found</div>;
  }

  return (
    <div className="member-profile">
      <div className="profile-header">
        <button onClick={() => navigate('/members')} className="back-btn">
          ← Back to Members
        </button>
        <h1>{member.name}</h1>
        <div className="header-actions">
          <button onClick={() => setShowQR(true)} className="qr-btn">
            📱 Show QR Code
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Member Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <span>{member.name}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{member.email}</span>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <span>{member.phone}</span>
            </div>
            <div className="info-item">
              <label>Status</label>
              <span>{getStatusBadge(member.status)}</span>
            </div>
            <div className="info-item">
              <label>Join Date</label>
              <span>{dayjs(member.joinDate).format('MMMM DD, YYYY')}</span>
            </div>
            <div className="info-item">
              <label>Last Payment</label>
              <span 
                className="payment-status"
                style={{ backgroundColor: getPaymentStatusColor(member.lastPaymentDate, member.joinDate, member.joinDay, member.nextPaymentDate) }}
              >
                {member.lastPaymentDate ? 
                  dayjs(member.lastPaymentDate).format('MMM DD, YYYY') : 
                  'No Payment Record'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Attendance Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{attendanceData.length}</div>
              <div className="stat-label">Total Visits</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {attendanceData.filter(date => 
                  dayjs(date).isSame(dayjs(), 'month')
                ).length}
              </div>
              <div className="stat-label">This Month</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {attendanceData.filter(date => 
                  dayjs(date).isSame(dayjs(), 'week')
                ).length}
              </div>
              <div className="stat-label">This Week</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {attendanceData.includes(dayjs().format('YYYY-MM-DD')) ? 'Yes' : 'No'}
              </div>
              <div className="stat-label">Today</div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <CalendarHeatmap attendanceData={attendanceData} />
        </div>
      </div>

      {showQR && (
        <div className="qr-modal">
          <div className="qr-content" id="qr-print-area">
            <h3>QR Code for {member.name}</h3>
            <QRCodeSVG value={member.id} size={250} />
            <p>Member ID: {member.id}</p>
            <p className="qr-instructions">
              Members can scan this QR code to log their attendance
            </p>
            <div className="qr-modal-actions">
              <button onClick={() => window.printQR('qr-print-area')} className="print-btn">
                Print QR
              </button>
              <button onClick={() => setShowQR(false)} className="close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

if (!window.printQR) {
  window.printQR = function (elementId) {
    const printContents = document.getElementById(elementId).innerHTML;
    const printWindow = window.open('', '', 'height=600,width=400');
    printWindow.document.write('<html><head><title>Print QR Code</title>');
    printWindow.document.write('<style>body{margin:0;padding:2rem;font-family:sans-serif;} h3,p{text-align:center;} .qr-content{display:flex;flex-direction:column;align-items:center;justify-content:center;} @media print { button { display: none !important; } }</style>');
    printWindow.document.write('</head><body >');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };
}

export default MemberProfile; 