import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeEditor } from '../context/ThemeContext';
import { requestNotificationPermission } from '../utils/notifications';

export default function Profile() {
  const { currentTheme, loadPreset } = useThemeEditor();
  const [notifsEnabled, setNotifsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const toggleNotifications = async () => {
    if (!notifsEnabled) {
      const granted = await requestNotificationPermission();
      setNotifsEnabled(granted);
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
              <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>hello@dailyplanner.app</div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.5rem' }}>License Status</label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--accent-green)', color: 'var(--text-color)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)' }}></div>
                LIFETIME PRO ACTIVATED
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
                      cursor: 'none',
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
                    cursor: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {notifsEnabled ? 'ENABLED' : 'ENABLE'}
                </button>
              </div>
            </div>

            {/* Data Export */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '1rem' }}>Data Management</label>
              <button
                className="interactive"
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
                  cursor: 'none',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                <span>Export Local Data (JSON)</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
}
