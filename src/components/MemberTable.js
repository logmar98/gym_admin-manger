import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';
import './MemberTable.css';

const MemberTable = ({ members, onEditMember, onViewProfile, refreshMembers, sortField, sortOrder, onSortField, onSortOrder }) => {
  const [showQR, setShowQR] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sort icon component
  const SortIcon = ({ columnName }) => {
    if (sortField === columnName) {
      return sortOrder === 'asc' ? (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      ) : (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      );
    }
    // Unsorted: generic sort icon (⇅)
    return (
      <svg width="16" height="16" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="8 9 12 5 16 9"/>
        <polyline points="16 15 12 19 8 15"/>
      </svg>
    );
  };

  const handleStatusChange = async (memberId, newStatus) => {
    try {
      await updateDoc(doc(db, 'members', memberId), {
        status: newStatus,
        updatedAt: new Date()
      });
      refreshMembers && refreshMembers();
    } catch (error) {
      console.error('Error updating member status:', error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await deleteDoc(doc(db, 'members', memberId));
        refreshMembers && refreshMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
  };

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

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Join Date', 'Last Payment'];
    const csvContent = [
      headers.join(','),
      ...members.map(member => [
        member.name,
        member.email,
        member.phone,
        member.status,
        member.joinDate,
        member.lastPaymentDate || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading">Loading members...</div>;
  }

  return (
    <div className="member-table-container">
      <div className="table-header">
        <h2>Members ({members.length})</h2>
        <div className="table-actions">
          <button onClick={exportToCSV} className="export-btn">
            📊 Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="member-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => onSortField('name')}>
                <span className="sortable-header"><SortIcon columnName="name" /> Name</span>
              </th>
              <th>Email</th>
              <th>Phone</th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSortField('status')}>
                <span className="sortable-header"><SortIcon columnName="status" /> Status</span>
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSortField('joinDate')}>
                <span className="sortable-header"><SortIcon columnName="joinDate" /> Join Date</span>
              </th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.email}</td>
                <td>{member.phone}</td>
                <td>{getStatusBadge(member.status)}</td>
                <td>{dayjs(member.joinDate).format('MMM DD, YYYY')}</td>
                <td>
                  <span 
                    className="payment-status"
                    style={{ 
                      backgroundColor: getPaymentStatusColor(member.lastPaymentDate, member.joinDate, member.joinDay, member.nextPaymentDate) 
                    }}
                  >
                    {member.lastPaymentDate ? 
                      dayjs(member.lastPaymentDate).format('MMM DD') : 
                      'No Payment'
                    }
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => onViewProfile(member)}
                      className="action-btn view-btn"
                      title="View Profile"
                    >
                      <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/></svg>
                    </button>
                    <button 
                      onClick={() => onEditMember(member)}
                      className="action-btn edit-btn"
                      title="Edit Member"
                    >
                      <svg width="20" height="20" fill="none" stroke="#ffc107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
                    </button>
                    <button 
                      onClick={() => setShowQR(showQR === member.id ? null : member.id)}
                      className="action-btn qr-btn"
                      title="Show QR Code"
                    >
                      <svg width="20" height="20" fill="none" stroke="#212529" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="2"/>
                        <rect x="14" y="3" width="7" height="7" rx="2"/>
                        <rect x="3" y="14" width="7" height="7" rx="2"/>
                        <rect x="14" y="14" width="3" height="3" rx="1"/>
                        <rect x="18" y="18" width="3" height="3" rx="1"/>
                      </svg>
                    </button>
                    <select 
                      value={member.status}
                      onChange={(e) => handleStatusChange(member.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="active">Active</option>
                      <option value="stopped">Stop</option>
                      <option value="banned">Ban</option>
                    </select>
                    <button 
                      onClick={() => handleDeleteMember(member.id)}
                      className="action-btn delete-btn"
                      title="Delete Member"
                    >
                      <svg width="20" height="20" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showQR && (
        <div className="qr-modal">
          <div className="qr-card" id="qr-print-area">
            <h3 className="qr-member-name">{members.find(m => m.id === showQR)?.name}</h3>
            <div className="qr-divider" />
            <div className="qr-code-area">
              <QRCodeSVG value={showQR} size={200} />
            </div>
            <div className="qr-member-id">Member ID: <span>{showQR}</span></div>
            <div className="qr-modal-actions">
              <button onClick={() => window.printQR('qr-print-area')} className="print-btn">
                Print QR
              </button>
              <button onClick={() => setShowQR(null)} className="close-btn">
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

export default MemberTable; 