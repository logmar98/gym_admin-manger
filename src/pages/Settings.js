import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import './Settings.css';

const Settings = () => {
  const [price, setPrice] = useState('');
  const [docId, setDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
      </div>
    </div>
  );
};

export default Settings; 