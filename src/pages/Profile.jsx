import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useThemeEditor } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';

export default function Profile() {
  const { currentTheme, loadPreset } = useThemeEditor();
  const { user, isPro, logout, deferredPrompt } = useContext(AuthContext);
  const [notifsEnabled, setNotifsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const toggleNotifications = async () => {
    if (!notifsEnabled) {
      const granted = await requestNotificationPermission();
      setNotifsEnabled(granted);
      if (granted) {
        sendNotification('Execute Pro', { body: 'Push notifications are now successfully enabled!' });
      }
    } else {
      alert("Please disable notifications in your browser settings to turn them off.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="px-content" 
      style={{ padding: '4rem 4vw', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}
    >
      <header>
        <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>
          Account <span className="italic" style={{ color: 'var(--dim-text)', fontWeight: 'normal' }}>& Settings</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--dim-text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Manage your planner preferences and license details.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
        
        {/* Profile Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            Profile Details
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.5rem' }}>Email Address</label>
              <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                {user ? user.email : 'Local Operator (Offline)'}
              </div>
              {!user && (
                <button 
                  onClick={() => window.location.hash = '#/login'}
                  className="interactive mt-2" 
                  style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', }}
                >
                  LOGIN TO CLOUD
                </button>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.5rem' }}>License Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', border: `1px solid ${isPro ? 'var(--accent-green)' : 'var(--border-color)'}`, color: 'var(--text-color)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPro ? 'var(--accent-green)' : 'var(--dim-text)' }}></div>
                  {isPro ? 'LIFETIME PRO ACTIVATED' : 'FREE / LOCAL ONLY'}
                </div>
                {user && !isPro && (
                  <button 
                    onClick={() => window.location.hash = '#/upgrade'}
                    className="interactive" 
                    style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 1rem', borderRadius: '16px', backgroundColor: 'transparent', color: 'var(--text-color)', border: '1px solid var(--text-color)', }}
                  >
                    UPGRADE TO PRO
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.5rem' }}>Current Level</label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <span style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)' }}>04</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--dim-text)' }}>1,450 XP Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            Preferences
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Theme Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '1rem' }}>App Theme</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['Editorial Minimal', 'Dark Slate'].map((presetName) => {
                  const isActive = currentTheme['--bg-color'] === (presetName === 'Editorial Minimal' ? '#F0EEE9' : '#0f1115');
                  return (
                  <button
                    key={presetName}
                    onClick={() => loadPreset(presetName)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: isActive ? 'var(--text-color)' : 'var(--card-bg)',
                      color: isActive ? 'var(--bg-color)' : 'var(--text-color)',
                      border: `1px solid ${isActive ? 'var(--text-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      textTransform: 'capitalize',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      
                      transition: 'all 0.2s ease'
                    }}
                    className="interactive"
                  >
                    {presetName}
                  </button>
                )})}
              </div>
            </div>

            {/* Placeholder for Notifications */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '1rem' }}>Notifications</label>
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Push Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dim-text)' }}>Receive alerts for daily habits and reminders.</div>
                </div>
                <button 
                  onClick={toggleNotifications}
                  className="interactive"
                  style={{ 
                    fontSize: '0.75rem', 
                    color: notifsEnabled ? '#000' : 'var(--text-color)', 
                    backgroundColor: notifsEnabled ? 'var(--accent-green)' : 'transparent',
                    fontWeight: 600, 
                    border: `1px solid ${notifsEnabled ? 'var(--accent-green)' : 'var(--border-color)'}`, 
                    padding: '0.5rem 1rem', 
                    borderRadius: '4px',
                    
                    transition: 'all 0.2s ease'
                  }}
                >
                  {notifsEnabled ? 'ENABLED' : 'ENABLE'}
                </button>
              </div>
            </div>

            {/* Data Export & Logout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0' }}>Data & Session</label>
              
              {isPro && (
                <button
                  className="interactive"
                  onClick={async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      console.log(`User response to the install prompt: ${outcome}`);
                    } else {
                      alert("Execute Pro is already installed on your device, or your browser does not support automatic installation. Check your browser menu or taskbar.");
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--accent-green)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--accent-green)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span>Install Desktop App (PWA)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
              )}

              <button
                className="interactive"
                onClick={(e) => {
                  if (!isPro) {
                    e.preventDefault();
                    alert("PRO FEATURE LOCKED: Local Data Export requires a Pro License. Redirecting to initialization sequence...");
                    window.location.hash = '#/upgrade';
                    return;
                  }
                  const data = JSON.stringify({ ...localStorage }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `execute-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'transparent',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                <span>Export Local Data (JSON) {!isPro && '🔒'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>

              <label
                className="interactive"
                onClick={(e) => {
                  if (!isPro) {
                    e.preventDefault();
                    alert("PRO FEATURE LOCKED: Local Data Import requires a Pro License. Redirecting to initialization sequence...");
                    window.location.hash = '#/upgrade';
                  }
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'transparent',
                  color: 'var(--dim-text)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-color)'; e.currentTarget.style.color = 'var(--text-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--dim-text)'; }}
              >
                <span>Import Local Data (JSON) {!isPro && '🔒'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 0-2 2h-4a2 2 0 0 0-2 2v4"></path><polyline points="17 10 12 5 7 10"></polyline><line x1="12" y1="5" x2="12" y2="17"></line></svg>
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      try {
                        const data = JSON.parse(evt.target.result);
                        if (typeof data !== 'object') throw new Error('Invalid format');
                        Object.keys(data).forEach(key => {
                          localStorage.setItem(key, data[key]);
                        });
                        alert("Backup restored successfully. The system will now reboot.");
                        window.location.reload();
                      } catch (err) {
                        alert("Failed to parse backup file.");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
              
              {user && (
                <button
                  onClick={() => {
                    logout();
                    window.location.hash = '#/';
                  }}
                  className="interactive"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <span>Logout from Cloud Sync</span>
                </button>
              )}
            </div>

            {/* Support Developer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0' }}>Support The Developer</label>
              <a
                href="https://www.buymeacoffee.com/"
                target="_blank"
                rel="noreferrer"
                className="interactive"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'var(--text-color)',
                  color: 'var(--bg-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                Buy Me A Coffee
              </a>
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
}
