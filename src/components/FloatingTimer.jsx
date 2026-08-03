import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';

function FloatingTimer() {
  const { 
    trackedTask, setTrackedTask,
    focusTimeLeft, setFocusTimeLeft,
    isFocusTimerActive, setIsFocusTimerActive,
    isFocusMode, setIsFocusMode,
    setCountdown
  } = useContext(AppContext);

  const [isExpanded, setIsExpanded] = useState(false);

  // Only show if we have an tracked task, we aren't in fullscreen mode, 
  // and either the timer is active or there's time left.
  if (isFocusMode || !trackedTask || (focusTimeLeft === 25 * 60 && !isFocusTimerActive && focusTimeLeft === 0)) {
    return null; // or if you want it to always show when there's an tracked task, change condition.
  }
  
  // Actually, let's just show it whenever there is an trackedTask and we are not in fullscreen.
  if (isFocusMode || !trackedTask) return null;

  const formatTime = (timeInSeconds) => {
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDoubleClick = () => {
    setIsFocusMode(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      layout
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 100,
        backgroundColor: '#0A0A0A',
        border: '1px solid #333',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        overflow: 'hidden'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      onDoubleClick={handleDoubleClick}
      title="Double-click to expand to Fullscreen"
    >
      {/* Circular Timer Display */}
      <motion.div
        layout
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: isFocusTimerActive ? '#D4F536' : '#222',
          color: isFocusTimerActive ? '#000' : '#F0EEE9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-serif)',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          flexShrink: 0
        }}
      >
        {formatTime(focusTimeLeft)}
      </motion.div>

      {/* Expanded Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            animate={{ width: 'auto', opacity: 1, marginLeft: '1rem' }}
            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
            style={{ display: 'flex', gap: '0.5rem', paddingRight: '0.5rem', overflow: 'hidden', whiteSpace: 'nowrap' }}
            onClick={(e) => e.stopPropagation()} // Prevent toggling expansion when clicking buttons
          >
            <button
              className="interactive"
              onClick={(e) => {
                e.stopPropagation();
                setIsFocusTimerActive(!isFocusTimerActive);
              }}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'transparent', border: '1px solid #333', color: '#D4F536',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={isFocusTimerActive ? "Pause" : "Play"}
            >
              {isFocusTimerActive ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              )}
            </button>

            <button
              className="interactive"
              onClick={(e) => {
                e.stopPropagation();
                setIsFocusTimerActive(false);
                setCountdown(null);
                setFocusTimeLeft(25 * 60); // Reset timer
                setTrackedTask(null); // This hides the timer
              }}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'transparent', border: '1px solid #333', color: '#FF3B30',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Stop Timer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"></rect></svg>
            </button>
            
            <button
              className="interactive"
              onClick={handleDoubleClick}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'transparent', border: '1px solid #333', color: '#8A8A85',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Fullscreen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default FloatingTimer;
