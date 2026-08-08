import React, { useEffect, useState } from 'react';

export default function NotificationFeed({ notification, onClose }) {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    // Start hiding animation slightly before it's actually removed from state
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
    }, 4700); // Assuming 5000ms duration total

    return () => clearTimeout(hideTimer);
  }, []);

  let borderColor = 'var(--accent-green)';
  if (notification.type === 'error') borderColor = '#ef4444';
  if (notification.type === 'info') borderColor = '#3b82f6';
  if (notification.type === 'warning') borderColor = '#f59e0b';

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      color: 'var(--text-color)',
      padding: '1rem',
      borderRadius: '8px',
      borderLeft: `4px solid ${borderColor}`,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      pointerEvents: 'auto',
      animation: isHiding ? 'slideOutRight 0.3s forwards' : 'slideInRight 0.3s forwards',
      fontFamily: 'var(--font-sans)',
      width: '320px',
      position: 'relative'
    }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {notification.icon || (
          notification.type === 'success' ? (
            <svg style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        )}
      </div>
      <div style={{ flex: 1, paddingRight: '1rem' }}>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {notification.title}
        </h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dim-text)', lineHeight: 1.4 }}>
          {notification.message}
        </p>
      </div>
      <button 
        onClick={() => { setIsHiding(true); setTimeout(onClose, 300); }}
        style={{ 
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'none', 
          border: 'none', 
          color: 'var(--dim-text)',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
