import React, { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext';

export default function CelebrationModal({ celebration, onClose }) {
  const { notificationStyle } = useUI();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const isModern = notificationStyle === 'modern';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: isModern ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'auto'
    }}>
      <div style={{
        backgroundColor: isModern ? '#0d0d0d' : 'var(--card-bg)',
        color: isModern ? '#f1efeb' : 'var(--text-color)',
        borderRadius: isModern ? '16px' : '4px',
        border: isModern ? 'none' : '2px solid var(--text-color)',
        padding: '3rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: isModern ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '8px 8px 0px var(--text-color)',
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        {/* Confetti / Sparkles Background Effect */}
        {isModern && <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent-green) 0%, transparent 50%)', pointerEvents: 'none' }}></div>}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            backgroundColor: isModern ? 'var(--accent-green)' : 'transparent', 
            border: isModern ? 'none' : '2px solid var(--text-color)',
            color: isModern ? '#0d0d0d' : 'var(--text-color)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.5rem auto',
            boxShadow: isModern ? '0 0 40px rgba(196, 243, 70, 0.4)' : 'none'
          }}>
            <svg style={{ width: '40px', height: '40px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.02em', textTransform: isModern ? 'none' : 'uppercase' }}>
            {celebration.title}
          </h2>
          {celebration.subtitle && (
            <p style={{ color: isModern ? 'var(--accent-green)' : 'var(--text-color)', fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {celebration.subtitle}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: isModern ? '#888' : 'var(--dim-text)', lineHeight: 1.5, marginBottom: '2rem' }}>
            {celebration.details}
          </p>

          <button 
            onClick={() => {
              if (celebration.primaryAction?.onClick) celebration.primaryAction.onClick();
              handleClose();
            }}
            className="interactive"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: isModern ? 'var(--accent-green)' : 'var(--text-color)', 
              border: 'none', 
              borderRadius: isModern ? '8px' : '4px', 
              color: isModern ? '#0d0d0d' : 'var(--bg-color)',
              fontWeight: 600,
              fontSize: '1rem',
              letterSpacing: isModern ? '0.05em' : '0.1em',
              textTransform: 'uppercase',
              boxShadow: isModern ? '0 4px 14px rgba(196, 243, 70, 0.3)' : 'none'
            }}
          >
            {celebration.primaryAction?.label || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
