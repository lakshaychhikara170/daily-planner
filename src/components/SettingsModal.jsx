import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SettingsModal({ isOpen, onClose }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('dailyPlannerTheme') || 'system');
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('dailyPlannerTheme', theme);
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const exportData = () => {
    const data = {
      appStartDate: localStorage.getItem('dailyPlannerStartDate'),
      routines: JSON.parse(localStorage.getItem('dailyPlannerRoutines') || '[]'),
      journals: JSON.parse(localStorage.getItem('dailyPlannerJournals') || '{}'),
      tasks: JSON.parse(localStorage.getItem('dailyPlannerTasks') || '[]'),
      reviewNotes: localStorage.getItem('dailyPlannerReviewNotes') || ''
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-planner-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.routines) localStorage.setItem('dailyPlannerRoutines', JSON.stringify(data.routines));
        if (data.journals) localStorage.setItem('dailyPlannerJournals', JSON.stringify(data.journals));
        if (data.appStartDate) localStorage.setItem('dailyPlannerStartDate', data.appStartDate);
        if (data.tasks) localStorage.setItem('dailyPlannerTasks', JSON.stringify(data.tasks));
        if (data.reviewNotes) localStorage.setItem('dailyPlannerReviewNotes', data.reviewNotes);
        
        setTimeout(() => window.location.reload(), 100);
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)', padding: '3rem',
              display: 'flex', flexDirection: 'column', gap: '2rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--text-color)' }}>Settings</h2>
              <button className="interactive" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.5rem' }}>×</button>
            </div>

            <div>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '1rem', color: 'var(--text-color)' }}>Appearance</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="interactive"
                  onClick={() => setTheme('system')}
                  style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: theme === 'system' ? 'var(--text-color)' : 'transparent', color: theme === 'system' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  title="System Theme"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                </button>
                <button
                  className="interactive"
                  onClick={() => setTheme('light')}
                  style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: theme === 'light' ? 'var(--text-color)' : 'transparent', color: theme === 'light' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  title="Light Theme"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                </button>
                <button
                  className="interactive"
                  onClick={() => setTheme('dark')}
                  style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: theme === 'dark' ? 'var(--text-color)' : 'transparent', color: theme === 'dark' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  title="Dark Theme"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '1rem', color: 'var(--text-color)' }}>Data Management</h3>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
                <button 
                  className="interactive"
                  onClick={exportData}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent', border: '1px solid var(--border-color)', padding: '1.5rem', color: 'var(--text-color)', borderRadius: '4px' }}
                  title="Export Backup"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
                <button 
                  className="interactive"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent', border: '1px solid var(--border-color)', padding: '1.5rem', color: 'var(--text-color)', borderRadius: '4px' }}
                  title="Import Backup"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </button>
                <input 
                  type="file" 
                  accept=".json"
                  ref={fileInputRef}
                  onChange={importData}
                  style={{ display: 'none' }}
                />
              </div>
              <p style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-color)' }}>
                All data is stored locally in your browser. Export a backup before clearing your cache or switching devices.
              </p>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SettingsModal;
