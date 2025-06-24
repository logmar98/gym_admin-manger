import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import './Payments.css';

const Payments = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'members'));
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentReceived = async (memberId) => {
    try {
      // Get the member's current data
      const memberRef = doc(db, 'members', memberId);
      const memberSnap = await getDoc(memberRef);
      let updateData = {
        lastPaymentDate: new Date().toISOString(),
        updatedAt: new Date()
      };
      if (memberSnap.exists()) {
        const data = memberSnap.data();
        if (!data.joinDay) {
          updateData.joinDay = dayjs().date();
        }
        if (!data.nextPaymentDate) {
          // First payment: set nextPaymentDate to same day next month
          updateData.nextPaymentDate = dayjs().add(1, 'month').date(dayjs().date()).toISOString();
        } else {
          // Subsequent payment: set nextPaymentDate to one month after current nextPaymentDate
          updateData.nextPaymentDate = dayjs(data.nextPaymentDate).add(1, 'month').toISOString();
        }
      }
      await updateDoc(memberRef, updateData);
      fetchMembers(); // Refresh the list
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const getPaymentStatus = (lastPaymentDate, joinDate, joinDay, nextPaymentDate) => {
    if (nextPaymentDate) {
      const now = dayjs();
      const dueDate = dayjs(nextPaymentDate);
      if (now.isBefore(dueDate, 'day')) {
        const daysLeft = dueDate.diff(now, 'day');
        return { status: 'current', days: `${daysLeft} days left`, color: 'green' };
      } else if (now.isAfter(dueDate, 'day')) {
        const daysLate = now.diff(dueDate, 'day');
        if (daysLate <= 5) return { status: 'warning', days: `${daysLate} days late`, color: 'yellow' };
        if (daysLate > 5 && daysLate <= 15) return { status: 'late', days: `${daysLate} days late`, color: 'orange' };
        return { status: 'overdue', days: `${daysLate} days late`, color: 'red' };
      } else {
        return { status: 'current', days: 'Due today', color: 'green' };
      }
    }
    // If nextPaymentDate is missing, always return overdue
    return { status: 'overdue', days: 'No payment', color: 'red' };
  };

  const exportPaymentsCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Last Payment', 'Days Since Payment', 'Status'];
    const csvContent = [
      headers.join(','),
      ...members.map(member => {
        const paymentStatus = getPaymentStatus(member.lastPaymentDate, member.joinDate, member.joinDay, member.nextPaymentDate);
        return [
          member.name,
          member.email,
          member.phone,
          member.lastPaymentDate ? dayjs(member.lastPaymentDate).format('MMM DD, YYYY') : 'No Payment',
          paymentStatus.days,
          paymentStatus.status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTodaysPayments = () => {
    const today = dayjs().format('YYYY-MM-DD');
    return members.filter(member => 
      member.lastPaymentDate && 
      dayjs(member.lastPaymentDate).format('YYYY-MM-DD') === today
    );
  };

  const getOverduePayments = () => {
    return members.filter(member => {
      const paymentStatus = getPaymentStatus(member.lastPaymentDate, member.joinDate, member.joinDay, member.nextPaymentDate);
      return paymentStatus.status === 'overdue';
    });
  };

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  const todaysPayments = getTodaysPayments();
  const overduePayments = getOverduePayments();

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>Payments Management</h1>
        <div className="header-actions">
          <button onClick={exportPaymentsCSV} className="export-btn">
            📊 Export CSV
          </button>
        </div>
      </div>

      <div className="payments-overview">
        <div className="overview-card">
          <h3>Today's Payments</h3>
          <div className="overview-value">{todaysPayments.length}</div>
          <div className="overview-label">Members paid today</div>
        </div>
        <div className="overview-card">
          <h3>Overdue Payments</h3>
          <div className="overview-value overdue">{overduePayments.length}</div>
          <div className="overview-label">Members need attention</div>
        </div>
        <div className="overview-card">
          <h3>Total Members</h3>
          <div className="overview-value">{members.length}</div>
          <div className="overview-label">Active members</div>
        </div>
      </div>

      <div className="payments-section">
        <h2>Payment Status</h2>
        <div className="table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Last Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const paymentStatus = getPaymentStatus(member.lastPaymentDate, member.joinDate, member.joinDay, member.nextPaymentDate);
                return (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.phone}</td>
                    <td>
                      {member.lastPaymentDate ? 
                        dayjs(member.lastPaymentDate).format('MMM DD, YYYY') : 
                        'No Payment'
                      }
                    </td>
                    <td>
                      <span 
                        className="payment-status-badge"
                        style={{ backgroundColor: paymentStatus.color }}
                      >
                        {paymentStatus.status.toUpperCase()}
                      </span>
                      <div className="payment-days">{paymentStatus.days}</div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handlePaymentReceived(member.id)}
                        className="mark-paid-btn"
                        disabled={paymentStatus.status === 'current'}
                      >
                        {paymentStatus.status === 'current' ? '✓ Paid' : 'Mark as Paid'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="payments-section">
        <h2>Today's Payments ({todaysPayments.length})</h2>
        {todaysPayments.length > 0 ? (
          <div className="todays-payments">
            {todaysPayments.map(member => (
              <div key={member.id} className="payment-card">
                <div className="payment-info">
                  <h4>{member.name}</h4>
                  <p>{member.email}</p>
                  <p>{member.phone}</p>
                </div>
                <div className="payment-time">
                  <span>Paid Today</span>
                  <small>{dayjs(member.lastPaymentDate).format('HH:mm')}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-payments">
            <p>No payments received today</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments; 