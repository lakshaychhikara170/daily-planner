import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Admin() {
  const { user, isAdmin, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ razorpayPrice: 49900, paypalPrice: 9.99 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (loading || !isAdmin || !user) {
      if (!loading) setIsLoadingData(false);
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        if (activeTab === 'users') {
          const res = await fetch(`/api/admin-users?uid=${user.uid}`);
          if (res.ok) {
            setUsers(await res.json());
          }
        } else if (activeTab === 'settings') {
          const res = await fetch(`/api/admin-settings?uid=${user.uid}`);
          if (res.ok) {
            setSettings(await res.json());
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      }
      setIsLoadingData(false);
    };

    fetchData();
  }, [activeTab, user, isAdmin, loading]);

  const handleUserAction = async (targetUid, action) => {
    setStatusMsg('');
    try {
      const res = await fetch('/api/admin-update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid, targetUid, action })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Success: ${action} applied.`);
        // Optimistic UI update
        setUsers(users.map(u => {
          if (u.id === targetUid) {
            if (action === 'ban') return { ...u, isBanned: true };
            if (action === 'unban') return { ...u, isBanned: false };
            if (action === 'grant_pro') return { ...u, isPro: true };
            if (action === 'revoke_pro') return { ...u, isPro: false };
          }
          return u;
        }));
      } else {
        setStatusMsg(`Error: ${data.message}`);
      }
    } catch (err) {
      setStatusMsg("Failed to execute action.");
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setStatusMsg('Saving...');
    try {
      const res = await fetch(`/api/admin-settings?uid=${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setStatusMsg('Settings saved successfully.');
      } else {
        setStatusMsg('Failed to save settings.');
      }
    } catch (err) {
      setStatusMsg('Error saving settings.');
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  if (loading || isLoadingData) {
    return <div className="px-content pt-8 text-center" style={{opacity: 0.5}}>Loading secure data...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="px-content pt-8 text-center" style={{ color: 'var(--accent-red)' }}>
        <h2>ACCESS DENIED</h2>
        <p>You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="px-content pt-8 fade-in pb-16">
      <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
        System Administration
      </h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('users')}
          className="interactive"
          style={{
            background: activeTab === 'users' ? 'var(--text-color)' : 'transparent',
            color: activeTab === 'users' ? 'var(--bg-color)' : 'var(--text-color)',
            border: '1px solid var(--text-color)',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: 500
          }}>
          Manage Users
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className="interactive"
          style={{
            background: activeTab === 'settings' ? 'var(--text-color)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--bg-color)' : 'var(--text-color)',
            border: '1px solid var(--text-color)',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: 500
          }}>
          System Settings
        </button>
      </div>

      {statusMsg && (
        <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'var(--accent-green)', color: '#000', borderRadius: '4px', fontWeight: 500 }}>
          {statusMsg}
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.7 }}>
                <th style={{ padding: '1rem 0' }}>Email</th>
                <th style={{ padding: '1rem 0' }}>Pro Status</th>
                <th style={{ padding: '1rem 0' }}>Ban Status</th>
                <th style={{ padding: '1rem 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0' }}>{u.email}</td>
                  <td style={{ padding: '1rem 0', color: u.isPro ? 'var(--accent-green)' : 'inherit' }}>
                    {u.isPro ? 'PRO' : 'Free'}
                  </td>
                  <td style={{ padding: '1rem 0', color: u.isBanned ? 'var(--accent-red)' : 'inherit' }}>
                    {u.isBanned ? 'BANNED' : 'Active'}
                  </td>
                  <td style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleUserAction(u.id, u.isBanned ? 'unban' : 'ban')}
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.8rem', 
                        borderRadius: '4px',
                        border: 'none',
                        background: u.isBanned ? 'var(--accent-green)' : 'var(--accent-red)',
                        color: '#000',
                        cursor: 'pointer'
                      }}>
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button 
                      onClick={() => handleUserAction(u.id, u.isPro ? 'revoke_pro' : 'grant_pro')}
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.8rem', 
                        borderRadius: '4px',
                        border: '1px solid var(--text-color)',
                        background: 'transparent',
                        color: 'var(--text-color)',
                        cursor: 'pointer'
                      }}>
                      {u.isPro ? 'Revoke Pro' : 'Grant Pro'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={handleSettingsSave} style={{ maxWidth: '400px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Razorpay Price (in Paise)
              <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6 }}>Example: 49900 = ₹499.00</span>
            </label>
            <input 
              type="number" 
              value={settings.razorpayPrice}
              onChange={(e) => setSettings({...settings, razorpayPrice: parseInt(e.target.value) || 0})}
              style={{
                width: '100%', padding: '0.75rem', background: 'var(--bg-color)', 
                color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              PayPal Price (in USD)
              <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6 }}>Example: 9.99</span>
            </label>
            <input 
              type="number" 
              step="0.01"
              value={settings.paypalPrice}
              onChange={(e) => setSettings({...settings, paypalPrice: parseFloat(e.target.value) || 0})}
              style={{
                width: '100%', padding: '0.75rem', background: 'var(--bg-color)', 
                color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px'
              }}
            />
          </div>

          <button type="submit" className="interactive" style={{
            width: '100%', padding: '1rem', background: 'var(--text-color)', 
            color: 'var(--bg-color)', border: 'none', borderRadius: '4px', fontWeight: 600
          }}>
            Save Settings
          </button>
        </form>
      )}
    </div>
  );
}

export default Admin;
