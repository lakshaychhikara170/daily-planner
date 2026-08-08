import React, { useEffect, useState } from 'react';

export default function Toast({ toast, onClose }) {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    // Start hiding animation slightly before it's actually removed from state
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
    }, 2700); // Assuming 3000ms duration total

    return () => clearTimeout(hideTimer);
  }, []);

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      color: 'var(--text-color)',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      pointerEvents: 'auto',
      animation: isHiding ? 'fadeOutDown 0.3s forwards' : 'slideInBottom 0.3s forwards',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.85rem',
      fontWeight: 500,
      minWidth: '250px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {toast.type === 'success' && (
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {toast.type === 'error' && (
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        {toast.message}
      </div>
      <button 
        onClick={() => { setIsHiding(true); setTimeout(onClose, 300); }} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--dim-text)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
