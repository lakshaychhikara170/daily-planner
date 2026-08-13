import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { playSound } from '../utils/soundUtils';

export default function ProUpsellNotification() {
  const { isPro } = useContext(AuthContext);
  const [viewState, setViewState] = useState('hidden'); // 'hidden', 'fullscreen', 'toast', 'coffee_toast'
  const [isIndia, setIsIndia] = useState(false);
  const timerRef = useRef(null);
  const showCountRef = useRef(0);

  useEffect(() => {
    const handleTestCoffee = () => setViewState('coffee_toast');
    const handleTestUpsellToast = () => setViewState('toast');
    const handleTestUpsellFullscreen = () => setViewState('fullscreen');
    
    window.addEventListener('test_coffee_toast', handleTestCoffee);
    window.addEventListener('test_upsell_toast', handleTestUpsellToast);
    window.addEventListener('test_upsell_fullscreen', handleTestUpsellFullscreen);

    const cleanup = () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('test_coffee_toast', handleTestCoffee);
      window.removeEventListener('test_upsell_toast', handleTestUpsellToast);
      window.removeEventListener('test_upsell_fullscreen', handleTestUpsellFullscreen);
    };

    if (isPro) return cleanup;

    const lastSeenStr = localStorage.getItem('execute_pro_fullscreen_last_seen');
    const lastSeen = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
    const now = Date.now();
    const NINE_HOURS_MS = 9 * 60 * 60 * 1000;
    
    if (now - lastSeen > NINE_HOURS_MS) {
      // First time or >9 hours passed: show fullscreen after 5 seconds
      timerRef.current = setTimeout(() => {
        setViewState('fullscreen');
      }, 5000);
    } else {
      // Returning user within 9 hours: show toast after 2 minutes
      scheduleNextToast(120000); 
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
        setIsIndia(true);
      }
    } catch (e) {
      // fallback
    }

    return cleanup;
  }, [isPro]);

  useEffect(() => {
    if (viewState === 'fullscreen' || viewState === 'toast') {
      playSound('alert');
    } else if (viewState === 'coffee_toast') {
      playSound('pop');
    }
  }, [viewState]);

  const scheduleNextToast = (delay) => {
    if (showCountRef.current >= 3) return; // Max 3 times per session
    timerRef.current = setTimeout(() => {
      setViewState('toast');
      showCountRef.current += 1;
    }, delay);
  };

  const handleDismissFullscreen = () => {
    localStorage.setItem('execute_pro_fullscreen_last_seen', Date.now().toString());
    // Immediately show the coffee toast
    setViewState('coffee_toast');
  };

  const handleDismissCoffeeToast = () => {
    setViewState('hidden');
    // Schedule the first Pro toast 5 minutes after dismissing the coffee toast
    scheduleNextToast(300000);
  };

  const handleDismissToast = () => {
    setViewState('hidden');
    // Schedule the next toast 10 minutes later
    scheduleNextToast(600000); 
  };

  if (isPro || viewState === 'hidden') return null;

  if (viewState === 'fullscreen') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .fullscreen-upsell-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          }
          .fullscreen-dismiss-btn:hover {
            color: var(--text-color) !important;
          }
        `}</style>
        
        <div style={{
          backgroundColor: '#f6f6f1', // Off-white cream from image
          border: '2px solid #111',
          borderRadius: '8px',
          boxShadow: '10px 10px 0px var(--accent-green)',
          maxWidth: '800px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden',
          color: '#111'
        }}>
          
          {/* Header */}
          <div style={{ 
            padding: '1.5rem 2rem', 
            borderBottom: '1px dashed #ccc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.15em', fontSize: '0.85rem' }}>
              <span style={{ color: '#111' }}>SYSTEM ALERT</span>
              <span style={{ color: 'var(--accent-green)', marginLeft: '0.75rem' }}>// CLOUD DISABLED</span>
            </div>
            <button 
              onClick={handleDismissFullscreen}
              className="interactive"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: '0.25rem' }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Hero Content */}
          <div style={{ padding: '3rem 4rem 2rem 4rem', display: 'flex', gap: '3rem', alignItems: 'center' }}>
            
            {/* Icon Graphic */}
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
              <div style={{ 
                position: 'absolute', inset: 0, 
                backgroundColor: '#efefe9', 
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </div>
              {/* Green orbital accent */}
              <svg style={{ position: 'absolute', inset: '-10px', width: '140px', height: '140px' }} viewBox="0 0 140 140">
                <path d="M 70 10 A 60 60 0 0 1 125 95" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="125" cy="95" r="5" fill="none" stroke="var(--accent-green)" strokeWidth="2" />
              </svg>
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: '3.5rem', 
                fontWeight: 500, 
                margin: '0 0 1rem 0',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#111'
              }}>
                Protect your <span style={{ backgroundColor: 'var(--accent-green)', padding: '0 0.5rem', display: 'inline-block', lineHeight: 1.1 }}>data.</span>
              </h2>
              <p style={{ 
                fontFamily: 'var(--font-sans)', 
                fontSize: '1rem', 
                color: '#555', 
                lineHeight: 1.5,
                margin: 0
              }}>
                Your tasks are stored locally on this device.<br/>
                Enable cloud sync to keep your routines, history,<br/>
                and progress <strong>safe across all your devices.</strong>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ margin: '0 4rem', borderTop: '1px solid #ddd' }}></div>

          {/* Features & Price */}
          <div style={{ 
            padding: '2rem 4rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            color: '#111',
            fontWeight: 500
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Secure Sync
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
              AES-256 Backup
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              Multi-device Access
            </div>
            <div style={{ width: '1px', height: '40px', backgroundColor: '#ddd' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', lineHeight: 1 }}>{isIndia ? '₹499' : '$9.99'}</span>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', opacity: 0.6, marginTop: '0.25rem' }}>ONE-TIME PAYMENT</span>
            </div>
          </div>

          {/* Call to Action */}
          <div style={{ padding: '0 4rem 3rem 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <button 
              className="fullscreen-upsell-btn interactive"
              onClick={() => {
                setViewState('hidden');
                window.location.hash = '#/upgrade';
              }}
              style={{
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                padding: '1.25rem 2rem',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.2em',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              <span>Activate Cloud Sync — {isIndia ? '₹499' : '$9.99'}</span>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent-green)">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            
            <button 
              className="fullscreen-dismiss-btn interactive"
              onClick={handleDismissFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Continue Offline (Risk Data Loss)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'coffee_toast') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '380px',
        backgroundColor: 'var(--text-color)',
        color: 'var(--bg-color)',
        border: '2px solid var(--text-color)',
        boxShadow: '8px 8px 0px var(--accent-green)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ 
          backgroundColor: 'var(--accent-green)', 
          color: 'var(--text-color)',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          fontSize: '0.85rem'
        }}>
          <span>Developer Message</span>
          <button 
            onClick={handleDismissCoffeeToast}
            className="interactive"
            style={{ 
              background: 'none', border: 'none', color: 'var(--text-color)',  fontSize: '1.2rem', lineHeight: 1
            }}
          >×</button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Support Execute Pro</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4' }}>
            I build software to help people become relentless. If this app helps you execute better, consider fueling the developer with some caffeine.
          </p>
          <a
            href="https://buymeacoffee.com/lakshaychhikara"
            target="_blank"
            rel="noreferrer"
            className="interactive"
            onClick={handleDismissCoffeeToast}
            style={{
              marginTop: '0.5rem',
              backgroundColor: 'transparent',
              color: 'var(--bg-color)',
              border: '2px solid var(--bg-color)',
              padding: '0.75rem',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              
              transition: 'all 0.2s ease',
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            Buy Me A Coffee
          </a>
        </div>
      </div>
    );
  }

  // Regular Toast State
  if (viewState === 'toast') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '420px',
        backgroundColor: 'var(--card-bg)',
        border: '2px solid var(--text-color)',
        boxShadow: '8px 8px 0px var(--text-color)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .upsell-toast-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
        `}</style>
        
        {/* Header */}
        <div style={{ 
          backgroundColor: 'var(--text-color)', 
          color: 'var(--bg-color)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--text-color)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--bg-color)' }}>SYSTEM ALERT</span>
            <span style={{ color: 'var(--accent-green)', marginLeft: '0.5rem' }}>// CLOUD DISABLED</span>
          </div>
          <button 
            onClick={handleDismissToast}
            className="interactive"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--bg-color)', 
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: 0
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#f6f6f1', color: '#111' }}>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {/* Graphic Icon */}
            <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
              <div style={{ 
                position: 'absolute', inset: 0, 
                backgroundColor: '#efefe9', 
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </div>
              {/* Green orbital accent */}
              <svg style={{ position: 'absolute', inset: '-5px', width: '70px', height: '70px' }} viewBox="0 0 70 70">
                <path d="M 35 5 A 30 30 0 0 1 62 47" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="62" cy="47" r="3" fill="none" stroke="var(--accent-green)" strokeWidth="2" />
              </svg>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', color: '#111' }}>Protect Your Data</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontFamily: 'var(--font-sans)', lineHeight: '1.4' }}>
                Your tasks are trapped locally.
              </p>
            </div>
          </div>

          <button 
            className="upsell-toast-btn interactive"
            onClick={() => {
              setViewState('hidden');
              window.location.hash = '#/upgrade';
            }}
            style={{
              backgroundColor: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '1rem',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Activate Cloud Sync - {isIndia ? '₹499' : '$9.99'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
