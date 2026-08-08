import React, { useEffect, useState } from 'react';

export default function CelebrationModal({ celebration, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        backgroundColor: '#0d0d0d', // Always dark for celebration
        color: '#f1efeb',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        {/* Confetti / Sparkles Background Effect */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent-green) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            backgroundColor: 'var(--accent-green)', color: '#0d0d0d', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 0 40px rgba(196, 243, 70, 0.4)'
          }}>
            <svg style={{ width: '40px', height: '40px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            {celebration.title}
          </h2>
          {celebration.subtitle && (
            <p style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {celebration.subtitle}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: '#888', lineHeight: 1.5, marginBottom: '2rem' }}>
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
              background: 'var(--accent-green)', 
              border: 'none', 
              borderRadius: '8px', 
              color: '#0d0d0d',
              fontWeight: 600,
              fontSize: '1rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 14px rgba(196, 243, 70, 0.3)'
            }}
          >
            {celebration.primaryAction?.label || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
