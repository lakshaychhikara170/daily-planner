import React, { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext';

export default function ConfirmDialog({ config, onClose }) {
  const { notificationStyle } = useUI();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleConfirm = () => {
    config.onConfirm();
    handleClose();
  };

  const isModern = notificationStyle === 'modern';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: isModern ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.2s ease',
      pointerEvents: 'auto'
    }}>
      <div style={{
        backgroundColor: isModern ? '#1f2937' : 'var(--card-bg)',
        border: isModern ? '1px solid #374151' : '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: isModern ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '4px 4px 0px var(--text-color)',
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1rem' }}>
          <button onClick={handleClose} className="interactive" style={{ background: 'none', border: 'none', color: isModern ? '#9ca3af' : 'var(--dim-text)', cursor: 'pointer' }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {config.isDestructive ? (
             <div style={{ 
               width: '48px', height: '48px', borderRadius: '50%', 
               backgroundColor: isModern ? 'rgba(239, 68, 68, 0.1)' : 'transparent', 
               border: isModern ? 'none' : '1px solid var(--accent-red)',
               color: isModern ? '#ef4444' : 'var(--accent-red)', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' 
             }}>
               <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </div>
          ) : (
             <div style={{ 
               width: '48px', height: '48px', borderRadius: '50%', 
               backgroundColor: isModern ? 'rgba(136, 136, 136, 0.1)' : 'transparent', 
               border: isModern ? 'none' : '1px solid var(--text-color)',
               color: isModern ? '#f9fafb' : 'var(--text-color)', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' 
             }}>
               <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
          )}
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: isModern ? '#f9fafb' : 'var(--text-color)' }}>
            {config.title}
          </h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: isModern ? '#d1d5db' : 'var(--dim-text)', lineHeight: 1.5 }}>
            {config.message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleClose}
            className="interactive"
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              background: 'transparent', 
              border: isModern ? '1px solid #4b5563' : '1px solid var(--border-color)', 
              borderRadius: isModern ? '6px' : '4px', 
              color: isModern ? '#e5e7eb' : 'var(--text-color)',
              fontWeight: 500,
              textTransform: isModern ? 'none' : 'uppercase',
              letterSpacing: isModern ? 'normal' : '0.05em'
            }}
          >
            {config.cancelText || 'Cancel'}
          </button>
          <button 
            onClick={handleConfirm}
            className="interactive"
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              background: config.isDestructive ? (isModern ? '#ef4444' : 'var(--accent-red)') : (isModern ? '#3b82f6' : 'var(--text-color)'), 
              border: isModern ? 'none' : '1px solid var(--text-color)', 
              borderRadius: isModern ? '6px' : '4px', 
              color: isModern ? '#fff' : 'var(--bg-color)',
              fontWeight: 600,
              textTransform: isModern ? 'none' : 'uppercase',
              letterSpacing: isModern ? 'normal' : '0.05em'
            }}
          >
            {config.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
