import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import './Settings.css';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [price, setPrice] = useState('');
  const [docId, setDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'price'));
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setDocId(docSnap.id);
          setPrice(docSnap.data().price || '');
        }
      } catch (err) {
        setError('Failed to load price.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrice();
  }, []);

  const handleSave = async () => {
    if (!docId) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateDoc(doc(db, 'price', docId), { price });
      setSuccess(true);
    } catch (err) {
      setError('Failed to update price.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2 className="settings-title">Settings</h2>
        {loading ? (
          <div className="settings-loading">Loading...</div>
        ) : (
          <form className="settings-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div className="form-group">
              <label htmlFor="price" className="settings-label">Price</label>
              <input
                id="price"
                type="text"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="settings-input"
              />
            </div>
            <button
              type="submit"
              className="settings-save-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {success && <div className="settings-success">Price updated!</div>}
            {error && <div className="settings-error">{error}</div>}
          </form>
        )}
        <button
          type="button"
          className="settings-logout-btn"
          style={{ display: 'block', margin: '24px auto 0 auto', background: '#dc3545', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Settings; 