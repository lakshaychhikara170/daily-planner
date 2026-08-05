import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';

function FullscreenTimer() {
  const { 
    trackedTask, setTrackedTask,
    focusTimeLeft, setFocusTimeLeft, 
    isFocusTimerActive, setIsFocusTimerActive,
    countdown, setCountdown,
    isFocusMode, setIsFocusMode,
    setShowCompletionPrompt, updateQuest
  } = useContext(AppContext);

  // We need local state for isEditingTimer since it's only UI related
  const [localIsEditingTimer, setLocalIsEditingTimer] = React.useState(false);

  if (!isFocusMode || !trackedTask) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#0A0A0A', zIndex: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', 
          marginBottom: '3rem', color: '#8A8A85', textAlign: 'center' 
        }}>
          <span style={{ color: '#D4F536', fontSize: '0.5rem' }}>●</span>
          <span>03 / FOCUS SESSION</span>
        </div>
        
        <div 
          style={{ 
            display: 'flex', alignItems: 'baseline', justifyContent: 'center',
            fontSize: 'clamp(8rem, 22vw, 22rem)', 
            fontFamily: 'var(--font-serif)', fontWeight: 'bold',
            lineHeight: 1, marginBottom: '5rem', minHeight: '1em',
            color: '#F0EEE9', fontVariantNumeric: 'tabular-nums', cursor: 'pointer'
          }}
          onDoubleClick={() => {
            if (countdown === null && !isFocusTimerActive) {
              setLocalIsEditingTimer(true);
            }
          }}
          title="Double-click to edit time"
        >
          {countdown !== null ? (
            <motion.div
              key={countdown}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ color: '#D4F536' }}
            >
              {countdown > 0 ? countdown : 'Go!'}
            </motion.div>
          ) : localIsEditingTimer ? (
            <input
              autoFocus
              type="number"
              min="1"
              max="999"
              defaultValue={Math.floor(focusTimeLeft / 60)}
              onBlur={(e) => {
                setFocusTimeLeft(Math.max(1, parseInt(e.target.value) || 25) * 60);
                setLocalIsEditingTimer(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
                if (e.key === 'Escape') setLocalIsEditingTimer(false);
              }}
              style={{
                background: 'transparent', border: 'none', color: '#D4F536',
                fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit',
                textAlign: 'center', width: '1.5em', outline: 'none', padding: 0
              }}
            />
          ) : (
            <>
              <span style={{ letterSpacing: '-0.02em' }}>
                {Math.floor(focusTimeLeft / 60).toString().padStart(2, '0')}
              </span>
              
              <span style={{ 
                fontSize: '0.4em', margin: '0 0.1em', transform: 'translateY(-0.15em)', opacity: 0.8 
              }}>:</span>
              
              <span style={{ 
                backgroundColor: '#D4F536', color: '#000000', 
                padding: '0 0.08em', letterSpacing: '-0.02em', display: 'inline-block' 
              }}>
                {(focusTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          <button 
            className="interactive"
            onClick={() => {
              if (isFocusTimerActive) {
                setIsFocusTimerActive(false);
              } else if (countdown !== null) {
                setCountdown(null);
              } else {
                setCountdown(3);
              }
            }}
            title={isFocusTimerActive ? "Pause" : "Resume"}
            style={{ 
              background: '#000000', border: 'none', borderRadius: '0',
              height: '80px', padding: '0 3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem',
              color: '#D4F536',  transition: 'all 0.2s ease', outline: 'none',
              fontFamily: 'var(--font-sans)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em'
            }}
          >
            {isFocusTimerActive ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Play</span>
              </>
            )}
          </button>

          {/* New Red Stop Button */}
          <button 
            className="interactive"
            onClick={() => {
              setIsFocusTimerActive(false);
              setCountdown(null);
              setFocusTimeLeft(25 * 60); // Reset timer
              setTrackedTask(null);
              setIsFocusMode(false);
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.log(err));
              }
            }}
            title="Stop Timer"
            style={{ 
              background: '#000000', border: 'none', borderRadius: '0',
              height: '80px', padding: '0 3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem',
              color: '#FF3B30',  transition: 'all 0.2s ease', outline: 'none',
              fontFamily: 'var(--font-sans)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"></rect></svg>
            <span>Stop</span>
          </button>
          
          <button 
            className="interactive"
            onClick={() => {
              setIsFocusMode(false);
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.log(err));
              }
            }}
            title="Exit Fullscreen"
            style={{ 
              background: '#000000', border: 'none', borderRadius: '0',
              height: '80px', padding: '0 3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem',
              color: '#F0EEE9',  transition: 'all 0.2s ease', opacity: 0.8, outline: 'none',
              fontFamily: 'var(--font-sans)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.8; }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            <span>Exit</span>
          </button>
        </div>
        
        <div style={{ marginTop: '3rem', fontSize: '1rem', color: '#8A8A85', fontStyle: 'italic', fontFamily: 'var(--font-serif)', letterSpacing: '0.02em' }}>
          Focusing on: {trackedTask.text}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
          {[15, 25, 50, 90].map(mins => (
            <button
              key={mins}
              className="interactive"
              onClick={() => {
                setFocusTimeLeft(mins * 60);
                setIsFocusTimerActive(false);
                setCountdown(null);
              }}
              style={{
                background: 'transparent', border: '1px solid #333', color: '#8A8A85',
                padding: '0.5rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--font-sans)',
                 transition: 'all 0.2s ease', borderRadius: '4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F0EEE9'; e.currentTarget.style.borderColor = '#F0EEE9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A85'; e.currentTarget.style.borderColor = '#333'; }}
            >
              {mins} MIN
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FullscreenTimer;
