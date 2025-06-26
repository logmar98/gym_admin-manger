import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import MemberTable from '../components/MemberTable';
import './Members.css';

const Members = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'members'));
      const membersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'members'), {
        ...formData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      joinDate: member.joinDate
    });
    setShowAddForm(true);
  };

  const handleViewProfile = (member) => {
    navigate(`/member/${member.id}`, { state: { member } });
  };

  // Search and sort logic
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.toLowerCase().includes(search.toLowerCase())
  );
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortField === 'name') {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      else return b.name.localeCompare(a.name);
    } else if (sortField === 'joinDate') {
      if (sortOrder === 'asc') return new Date(a.joinDate) - new Date(b.joinDate);
      else return new Date(b.joinDate) - new Date(a.joinDate);
    }
    return 0;
  });

  return (
    <>
      <div className="main-header">
        <h1>Members Management</h1>
      </div>
      <div className="main-inner">
        <div className="card">
          <div className="page-header">
            <button 
              onClick={() => setShowAddForm(true)} 
              className="add-member-btn"
            >
              ➕ Add New Member
            </button>
            {/* Search box */}
            <div className="search-box">
              <input
                type="text"
                placeholder="Search members by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="member-search-input"
              />
            </div>
          </div>

          {showAddForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
                  <button 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMember(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        joinDate: new Date().toISOString().split('T')[0]
                      });
                    }}
                    className="close-btn"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleAddMember} className="member-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="joinDate">Join Date *</label>
                    <input
                      type="date"
                      id="joinDate"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="submit-btn">
                      {editingMember ? 'Update Member' : 'Add Member'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingMember(null);
                      }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <MemberTable 
            members={sortedMembers}
            onEditMember={handleEditMember}
            onViewProfile={handleViewProfile}
            refreshMembers={fetchMembers}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortField={field => {
              if (sortField === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(field);
                setSortOrder('asc');
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Members; 