import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

function Admin() {
  const { user, isAdmin, loading } = useContext(AuthContext);
  const { showConfirm, addToast, showCelebration } = useUI();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ razorpayPrice: 49900, paypalPrice: 9.99, notificationFrequency: 'daily' });
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
        <button 
          onClick={() => setActiveTab('notifications')}
          className="interactive"
          style={{
            background: activeTab === 'notifications' ? 'var(--text-color)' : 'transparent',
            color: activeTab === 'notifications' ? 'var(--bg-color)' : 'var(--text-color)',
            border: '1px solid var(--text-color)',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: 500
          }}>
          Test Notifications
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Global Notification Frequency
              <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6 }}>How often system reminders are sent out.</span>
            </label>
            <select
              value={settings.notificationFrequency}
              onChange={(e) => setSettings({...settings, notificationFrequency: e.target.value})}
              style={{
                width: '100%', padding: '0.75rem', background: 'var(--bg-color)', 
                color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px'
              }}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <button type="submit" className="interactive" style={{
            width: '100%', padding: '1rem', background: 'var(--text-color)', 
            color: 'var(--bg-color)', border: 'none', borderRadius: '4px', fontWeight: 600
          }}>
            Save Settings
          </button>
        </form>
      )}
      {activeTab === 'notifications' && (
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Test UI Notifications & Popups</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            
            {/* Toast Notifications */}
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Toast Notification</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', height: '40px' }}>Non-blocking alerts in the bottom right corner.</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <button onClick={() => addToast('System operating normally.', 'default')} className="interactive" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}>Default</button>
                <button onClick={() => addToast('Data synced successfully.', 'success')} className="interactive" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--accent-green)', background: 'transparent', color: 'var(--text-color)' }}>Success</button>
                <button onClick={() => addToast('Connection lost.', 'error')} className="interactive" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--accent-red)', background: 'transparent', color: 'var(--text-color)' }}>Error</button>
              </div>
              
              <button 
                onClick={() => addToast('Toast properties configuration coming in v2.1', 'default')} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px dashed var(--text-color)', background: 'transparent', color: 'var(--text-color)', fontSize: '0.85rem' }}
              >
                Edit Properties
              </button>
            </div>

            {/* Confirmation Modal */}
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Confirmation Modal</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', height: '40px' }}>Blocking modal requiring user choice.</p>
              
              <button 
                onClick={() => showConfirm({
                  title: "Test Destructive Action",
                  message: "Are you sure you want to test this? It will show a success toast if you confirm.",
                  confirmText: "Yes, Execute",
                  isDestructive: true,
                  onConfirm: () => addToast('Confirmed execution.', 'success')
                })} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', marginBottom: '1rem', borderRadius: '4px', border: 'none', background: 'var(--text-color)', color: 'var(--bg-color)', fontWeight: 600 }}
              >
                Test Confirmation
              </button>
              
              <button 
                onClick={() => addToast('Confirmation properties configuration coming in v2.1', 'default')} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px dashed var(--text-color)', background: 'transparent', color: 'var(--text-color)', fontSize: '0.85rem' }}
              >
                Edit Properties
              </button>
            </div>

            {/* Celebration Modal */}
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Celebration Modal</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', height: '40px' }}>Full-screen milestone reward modal.</p>
              
              <button 
                onClick={() => showCelebration({
                  title: "Level Up!",
                  subtitle: "Admin Testing Complete",
                  details: "You successfully triggered the celebration modal. Great job executing.",
                  primaryAction: { label: "Awesome" }
                })} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', marginBottom: '1rem', borderRadius: '4px', border: 'none', background: 'var(--accent-green)', color: '#000', fontWeight: 600 }}
              >
                Test Celebration
              </button>

              <button 
                onClick={() => addToast('Celebration properties configuration coming in v2.1', 'default')} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px dashed var(--text-color)', background: 'transparent', color: 'var(--text-color)', fontSize: '0.85rem' }}
              >
                Edit Properties
              </button>
            </div>
            
            {/* Buy Me a Coffee Modal */}
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Developer Coffee Modal</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', height: '40px' }}>Bottom-right floating toast for donations.</p>
              
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('test_coffee_toast'))} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', marginBottom: '1rem', borderRadius: '4px', border: 'none', background: 'var(--text-color)', color: 'var(--bg-color)', fontWeight: 600 }}
              >
                Test Coffee Modal
              </button>

              <button 
                onClick={() => addToast('Coffee modal properties coming in v2.1', 'default')} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px dashed var(--text-color)', background: 'transparent', color: 'var(--text-color)', fontSize: '0.85rem' }}
              >
                Edit Properties
              </button>
            </div>

            {/* Purchase Upsell Modal */}
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Pro Purchase Upsell</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', height: '40px' }}>The full-screen / toast paywall alerts.</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('test_upsell_toast'))} 
                  className="interactive" style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: 'var(--text-color)', color: 'var(--bg-color)', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Test Toast
                </button>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('test_upsell_fullscreen'))} 
                  className="interactive" style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: 'var(--accent-red)', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Test Full
                </button>
              </div>

              <button 
                onClick={() => addToast('Upsell properties configuration coming in v2.1', 'default')} 
                className="interactive" style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px dashed var(--text-color)', background: 'transparent', color: 'var(--text-color)', fontSize: '0.85rem' }}
              >
                Edit Properties
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
