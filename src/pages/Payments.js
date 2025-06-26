import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, getDoc, query, where, addDoc, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import './Payments.css';

const Payments = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [allPayments, setAllPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [lastPaymentVisible, setLastPaymentVisible] = useState(null);
  const [hasMorePayments, setHasMorePayments] = useState(true);

  useEffect(() => {
    fetchMembers();
    fetchAllPayments(true);
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

  const fetchAllPayments = async (reset = true) => {
    setLoadingPayments(true);
    try {
      let q = query(collection(db, 'payments'), orderBy('date', 'desc'), limit(10));
      if (!reset && lastPaymentVisible) {
        q = query(collection(db, 'payments'), orderBy('date', 'desc'), startAfter(lastPaymentVisible), limit(10));
      }
      const paymentsSnapshot = await getDocs(q);
      const payments = [];
      for (const docSnap of paymentsSnapshot.docs) {
        const payment = { id: docSnap.id, ...docSnap.data() };
        // Fetch member name
        let memberName = '';
        if (payment.memberId) {
          const memberDoc = await getDoc(doc(db, 'members', payment.memberId));
          memberName = memberDoc.exists() ? memberDoc.data().name : '';
        }
        payments.push({ ...payment, memberName });
      }
      if (reset) {
        setAllPayments(payments);
      } else {
        setAllPayments(prev => [...prev, ...payments]);
      }
      setLastPaymentVisible(paymentsSnapshot.docs[paymentsSnapshot.docs.length - 1]);
      setHasMorePayments(paymentsSnapshot.docs.length === 10);
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoadingPayments(false);
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

      // Fetch price from settings
      const priceSnapshot = await getDocs(collection(db, 'price'));
      let price = 0;
      if (!priceSnapshot.empty) {
        price = priceSnapshot.docs[0].data().price || 0;
      }
      // Add payment record
      await addDoc(collection(db, 'payments'), {
        memberId,
        amount: price,
        date: new Date().toISOString(),
        method: 'cash'
      });

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
    const headers = ['Name', 'Email', 'Phone', 'Last Payment', 'Status'];
    const escapeCSV = (value) => '"' + String(value).replace(/"/g, '""') + '"';
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...members.map(member => {
        const paymentStatus = getPaymentStatus(member.lastPaymentDate, member.joinDate, member.joinDay, member.nextPaymentDate);
        return [
          member.name || '',
          member.email || '',
          member.phone || '',
          member.lastPaymentDate ? dayjs(member.lastPaymentDate).format('MMM DD, YYYY') : 'No Payment',
          paymentStatus.status || ''
        ].map(escapeCSV).join(',');
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

  // Members who should pay today and haven't paid yet
  const today = dayjs().format('YYYY-MM-DD');
  const dueTodayMembers = members.filter(member => {
    if (member.status !== 'active') return false;
    // Never paid: no lastPaymentDate and no nextPaymentDate
    if (!member.lastPaymentDate && !member.nextPaymentDate) return true;
    // Due today and not paid today
    if (member.nextPaymentDate) {
      const dueDate = dayjs(member.nextPaymentDate).format('YYYY-MM-DD');
      const lastPaid = member.lastPaymentDate ? dayjs(member.lastPaymentDate).format('YYYY-MM-DD') : null;
      return dueDate === today && lastPaid !== today;
    }
    return false;
  });

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

  // Sort and filter members for Payment Status table
  const activeMembers = members.filter(member => member.status === 'active');
  const sortedMembers = [...activeMembers].sort((a, b) => {
    if (sortField === 'name') {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      else return b.name.localeCompare(a.name);
    } else if (sortField === 'status') {
      // Custom order: current < warning < late < overdue
      const getStatusOrder = (member) => {
        const paymentStatus = getPaymentStatus(member.lastPaymentDate, member.joinDate, member.joinDay, member.nextPaymentDate).status;
        const order = { current: 1, warning: 2, late: 3, overdue: 4 };
        return order[paymentStatus] || 5;
      };
      if (sortOrder === 'asc') return getStatusOrder(a) - getStatusOrder(b);
      else return getStatusOrder(b) - getStatusOrder(a);
    } else if (sortField === 'lastPayment') {
      const aDate = a.lastPaymentDate ? new Date(a.lastPaymentDate) : new Date(0);
      const bDate = b.lastPaymentDate ? new Date(b.lastPaymentDate) : new Date(0);
      if (sortOrder === 'asc') return aDate - bDate;
      else return bDate - aDate;
    }
    return 0;
  });

  // Toggle sort order or change field
  const handleSortField = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export all payments to CSV
  const exportAllPaymentsCSV = () => {
    const headers = ['Date', 'Member Name', 'Amount', 'Method'];
    const escapeCSV = (value) => '"' + String(value).replace(/"/g, '""') + '"';
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...allPayments.map(payment => [
        dayjs(payment.date).format('MMM DD, YYYY'),
        payment.memberName,
        payment.amount,
        payment.method || '-'
      ].map(escapeCSV).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-payments-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShowMorePayments = () => {
    fetchAllPayments(false);
  };

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  const todaysPayments = getTodaysPayments();
  const overduePayments = getOverduePayments();

  return (
    <>

      <div className="main-inner">
        <div className="card">
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

          {/* Due Today Section */}
          {dueTodayMembers.length > 0 && (
            <div className="payments-section">
              <h2>Due Today (Unpaid)</h2>
              <div className="table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Last Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dueTodayMembers.map(member => (
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
                          <button 
                            onClick={() => handlePaymentReceived(member.id)}
                            className="mark-paid-btn"
                          >
                            Mark as Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

          <div className="payments-section">
            <h2>Payment Status</h2>
            <div className="table-wrapper">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSortField('name')}>
                      <span className="sortable-header"><SortIcon columnName="name" /> Member Name</span>
                    </th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSortField('lastPayment')}>
                      <span className="sortable-header"><SortIcon columnName="lastPayment" /> Last Payment</span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSortField('status')}>
                      <span className="sortable-header"><SortIcon columnName="status" /> Status</span>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.map(member => {
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
                          >
                            Mark as Paid
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Payments Report */}
          <div className="payments-section">
            <h2>All Payments</h2>
            <button onClick={exportAllPaymentsCSV} className="export-btn" style={{ marginBottom: 16 }}>
              📊 Export All Payments CSV
            </button>
            {loadingPayments ? (
              <div className="loading">Loading all payments...</div>
            ) : allPayments.length === 0 ? (
              <div className="no-records">No payments found.</div>
            ) : (
              <>
              <div className="table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Member Name</th>
                      <th>Amount</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map(payment => (
                      <tr key={payment.id}>
                        <td>{dayjs(payment.date).format('MMM DD, YYYY')}</td>
                        <td>{payment.memberName}</td>
                        <td>{payment.amount}</td>
                        <td>{payment.method || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMorePayments && !loadingPayments && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" onClick={handleShowMorePayments}>Show More</button>
                </div>
              )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Payments; 