import React, { useEffect, useState } from 'react';

export default function Toast({ toast, onClose }) {
  const [isHiding, setIsHiding] = useState(false);
  
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
    }, 2700);

    return () => clearTimeout(hideTimer);
  }, []);

  const getStyle = () => {
    switch (toast.type) {
      case 'success': return { bg: '#22c55e', border: '1px solid #16a34a', color: '#166534', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> };
      case 'error': return { bg: '#ef4444', border: '1px solid #dc2626', color: '#7f1d1d', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg> };
      default: return { bg: '#3b82f6', border: '1px solid #2563eb', color: '#1e3a8a', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> };
    }
  };

  const styleObj = getStyle();

  return (
    <div style={{
      backgroundColor: '#1f2937',
      color: '#f9fafb',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      pointerEvents: 'auto',
      animation: isHiding ? 'slideOutRight 0.3s forwards' : 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      minWidth: '320px',
      overflow: 'hidden',
      border: '1px solid #374151'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: styleObj.bg, display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 0 8px ' + styleObj.bg + '40)' }}>
            {styleObj.icon}
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.02em' }}>{toast.message}</span>
        </div>
        <button 
          onClick={() => { setIsHiding(true); setTimeout(onClose, 300); }} 
          style={{ 
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div style={{
        height: '4px',
        backgroundColor: styleObj.bg,
        width: '100%',
        animation: 'toastProgress 3s linear forwards',
        boxShadow: '0 0 10px ' + styleObj.bg
      }} />
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
