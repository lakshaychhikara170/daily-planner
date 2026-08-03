import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function GamificationHUD() {
  const { isGamified, points, showPointsAnimation, lastPointsGained, levelInfo, streak, xpMultiplier, dailyQuests } = useContext(AppContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Auto-hide logic
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      if (!isExpanded) {
        setIsVisible(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [points, isExpanded]);

  if (!isGamified) return null;

  const { level, progress, xpRemaining, xpForNextLevel } = levelInfo;

  return (
    <motion.div 
      drag 
      dragMomentum={false}
      style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '50%', 
        x: '-50%', // use framer-motion's x instead of transform
        zIndex: 9999, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}
    >
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key="maximized"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div 
              className="interactive"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                backgroundColor: 'var(--card-bg)',
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {streak.count >= 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
                  <span>🔥</span> {streak.count} <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({xpMultiplier}x)</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', letterSpacing: '0.05em' }}>
                  Level {level}
                </div>
                <div style={{ width: '120px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--text-color)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' }}>
                {isExpanded ? (
                  <>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
                      {xpRemaining} <span style={{ fontSize: '1rem', color: 'var(--dim-text)' }}>/ {xpForNextLevel}</span> <span style={{ fontSize: '0.7rem', color: 'var(--dim-text)', fontFamily: 'var(--font-sans)' }}>XP</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--dim-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                      Total: {points}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
                    {points} <span style={{ fontSize: '0.7rem', color: 'var(--dim-text)', fontFamily: 'var(--font-sans)' }}>XP</span>
                  </div>
                )}
                
                <AnimatePresence>
                  {showPointsAnimation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -25, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        top: -10,
                        right: 0,
                        color: 'var(--text-color)',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        whiteSpace: 'nowrap',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      +{lastPointsGained}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && dailyQuests && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  style={{ 
                    marginTop: '10px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', 
                    border: '1px solid var(--border-color)', padding: '1.5rem', width: '100%', 
                    minWidth: '300px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--dim-text)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Daily Quests</span>
                    {dailyQuests.rewardClaimed && <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>COMPLETED!</span>}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {dailyQuests.quests.map(q => (
                      <div key={q.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                          <span style={{ textDecoration: q.completed ? 'line-through' : 'none', opacity: q.completed ? 0.5 : 1 }}>{q.text}</span>
                          <span style={{ fontFamily: 'var(--font-serif)', color: q.completed ? 'var(--accent-green)' : 'var(--text-color)' }}>{q.progress} / {q.target}</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${(q.progress / q.target) * 100}%`, height: '100%', backgroundColor: q.completed ? 'var(--accent-green)' : 'var(--text-color)', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
