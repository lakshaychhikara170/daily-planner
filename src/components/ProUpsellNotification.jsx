import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';

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

    if (isPro) return;

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

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('test_coffee_toast', handleTestCoffee);
      window.removeEventListener('test_upsell_toast', handleTestUpsellToast);
      window.removeEventListener('test_upsell_fullscreen', handleTestUpsellFullscreen);
    };
  }, [isPro]);

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

  if (viewState === 'hidden') return null;

  if (viewState === 'fullscreen' && !isPro) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .fullscreen-upsell-btn:hover {
            background-color: var(--accent-green) !important;
            color: var(--bg-color) !important;
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
          }
          .fullscreen-dismiss-btn:hover {
            text-decoration: line-through;
            opacity: 1 !important;
          }
        `}</style>
        
        <div style={{
          backgroundColor: 'var(--bg-color)',
          border: '4px solid var(--text-color)',
          boxShadow: '16px 16px 0px var(--accent-green)',
          maxWidth: '600px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Danger Strip */}
          <div style={{ 
            height: '12px', 
            background: 'repeating-linear-gradient(45deg, var(--text-color), var(--text-color) 10px, var(--accent-green) 10px, var(--accent-green) 20px)' 
          }}></div>
          
          <div style={{ padding: '3rem 2.5rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontFamily: 'var(--font-serif)', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              margin: '0 0 1rem 0',
              lineHeight: 1.1
            }}>
              Don't Lose Your<br/>Progression
            </h2>
            
            <p style={{ 
              fontSize: '1rem', 
              color: 'var(--dim-text)', 
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
              marginBottom: '2rem'
            }}>
              You are operating on a local-only instance. If your browser cache is cleared or your device is lost, <strong>all task history, routines, and XP will be permanently destroyed.</strong>
            </p>

            <div style={{ 
              backgroundColor: 'var(--card-bg)',
              border: '2px solid var(--border-color)',
              padding: '1.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: 'var(--text-color)' }}>PRO LICENSE PROTOCOLS:</h3>
              <ul style={{ 
                listStyle: 'none', padding: 0, margin: 0, 
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.9rem'
              }}>
                <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--accent-green)' }}>[✓]</span> Real-time synchronization to Cloud</li>
                <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--accent-green)' }}>[✓]</span> Military-grade AES-256 Backups</li>
                <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--accent-green)' }}>[✓]</span> Seamless Multi-device Access (Mobile/Desktop)</li>
                <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--accent-green)' }}>[✓]</span> Single {isIndia ? '₹499' : '$9.99'} Payment. No subscriptions.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className="fullscreen-upsell-btn interactive"
                onClick={() => {
                  setViewState('hidden');
                  window.location.hash = '#/upgrade';
                }}
                style={{
                  backgroundColor: 'var(--text-color)',
                  color: 'var(--bg-color)',
                  border: '2px solid var(--text-color)',
                  padding: '1.25rem',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
              >
                INITIALIZE UPGRADE - {isIndia ? '₹499' : '$9.99'}
              </button>
              
              <button 
                className="fullscreen-dismiss-btn interactive"
                onClick={handleDismissFullscreen}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--dim-text)',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  
                  transition: 'all 0.2s ease',
                  opacity: 0.7,
                  fontFamily: 'var(--font-sans)'
                }}
              >
                Continue Offline (Acknowledge Risk)
              </button>
            </div>
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
  if (viewState === 'toast' && !isPro) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '380px',
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
          @keyframes pulseBorder {
            0% { border-color: var(--text-color); }
            50% { border-color: var(--accent-green); }
            100% { border-color: var(--text-color); }
          }
          .upsell-toast-btn:hover {
            background-color: var(--accent-green) !important;
            color: var(--bg-color) !important;
            transform: translateY(-2px);
          }
        `}</style>
        
        {/* Header */}
        <div style={{ 
          backgroundColor: 'var(--text-color)', 
          color: 'var(--bg-color)',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          fontSize: '0.85rem'
        }}>
          <span>System Alert // Cloud Disabled</span>
          <button 
            onClick={handleDismissToast}
            className="interactive"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--bg-color)', 
              
              fontSize: '1.2rem',
              lineHeight: 1
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Graphic Icon */}
            <div style={{ 
              width: '50px', 
              height: '50px', 
              backgroundColor: 'var(--bg-color)',
              border: '2px solid var(--text-color)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              animation: 'pulseBorder 2s infinite'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-color)" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
              </svg>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Protect Your Data</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dim-text)', lineHeight: '1.4' }}>
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
              marginTop: '0.5rem',
              backgroundColor: 'var(--text-color)',
              color: 'var(--bg-color)',
              border: '2px solid var(--text-color)',
              padding: '0.75rem',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              
              transition: 'all 0.2s ease',
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
