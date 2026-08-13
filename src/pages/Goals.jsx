import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveMediaBlob, deleteMediaBlob, getMediaBlob } from '../utils/storage';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';

function Goals() {
  const { user, loginWithGoogle } = useContext(AuthContext);
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerGoals');
    return saved ? JSON.parse(saved) : [];
  });

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [activeGoal, setActiveGoal] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const [mainFocusId, setMainFocusId] = useState(() => localStorage.getItem('execute_pro_main_focus'));
  useEffect(() => {
    const handleFocusUpdate = () => setMainFocusId(localStorage.getItem('execute_pro_main_focus'));
    window.addEventListener('mainFocusUpdated', handleFocusUpdate);
    return () => window.removeEventListener('mainFocusUpdated', handleFocusUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyPlannerGoals', JSON.stringify(goals));
    window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: { source: 'GoalsPage' } }));
  }, [goals]);

  // Listen for changes coming from StickyWidget
  useEffect(() => {
    const handleGoalsUpdated = (e) => {
      if (e.detail && e.detail.source === 'GoalsPage') return;
      const saved = localStorage.getItem('dailyPlannerGoals');
      if (saved) {
        setGoals(JSON.parse(saved));
      }
    };
    window.addEventListener('goalsUpdated', handleGoalsUpdated);
    return () => window.removeEventListener('goalsUpdated', handleGoalsUpdated);
  }, []);

  const addGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalTargetDate) return;
    
    const newId = goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1;
    const startStr = new Date().toISOString().split('T')[0];
    const start = new Date(startStr);
    const end = new Date(newGoalTargetDate);
    const diffTime = end - start;
    const targetDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const goal = {
      id: newId,
      title: newGoalTitle.trim(),
      targetDays: targetDays,
      targetDate: newGoalTargetDate,
      startDate: startStr,
      isCompleted: false,
      details: '',
      media: []
    };

    setGoals([...goals, goal]);
    setNewGoalTitle('');
    setNewGoalTargetDate('');
  };

  const updateGoalDetails = (id, details) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, details } : g));
    if (activeGoal && activeGoal.id === id) setActiveGoal(prev => ({ ...prev, details }));
  };

  const processFile = async (file) => {
    if (!file || !activeGoal) return;
    
    const mediaId = await saveMediaBlob(file);
    const newMediaObj = {
      id: mediaId,
      type: file.type,
      x: 20 + Math.random() * 50,
      y: 20 + Math.random() * 50,
      width: 250,
      height: 250,
      zIndex: 1
    };

    setGoals(prev => prev.map(g => {
      if (g.id === activeGoal.id) {
        return { ...g, media: [...(g.media || []), newMediaObj] };
      }
      return g;
    }));
    
    setActiveGoal(prev => {
      if (!prev) return prev;
      return { ...prev, media: [...(prev.media || []), newMediaObj] };
    });
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        processFile(file);
      });
    }
  };

  const deleteMedia = async (goalId, mediaId) => {
    await deleteMediaBlob(mediaId);
    const currentMedia = goals.find(g => g.id === goalId)?.media || [];
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, media: currentMedia.filter(m => m.id !== mediaId) } : g));
    if (activeGoal && activeGoal.id === goalId) setActiveGoal(prev => ({ ...prev, media: currentMedia.filter(m => m.id !== mediaId) }));
  };

  const bringToFront = (goalId, mediaId) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.media) return;
    
    const highestZ = Math.max(0, ...goal.media.map(m => m.zIndex || 1));
    const newMedia = goal.media.map(m => m.id === mediaId ? { ...m, zIndex: highestZ + 1 } : m);
    
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, media: newMedia } : g));
    if (activeGoal && activeGoal.id === goalId) setActiveGoal(prev => ({ ...prev, media: newMedia }));
  };

  const toggleGoal = (id) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g));
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const getDaysPassed = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <main className="px-content py-section" style={{ minHeight: 'calc(100vh - 80px)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glow */}
      <div style={{ 
        position: 'absolute', 
        top: '10%', 
        right: '10%', 
        width: '400px', 
        height: '400px', 
        backgroundColor: 'var(--accent-red)', 
        filter: 'blur(150px)', 
        opacity: 0.1,
        borderRadius: '50%',
        zIndex: 0
      }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ marginBottom: '4vh', position: 'relative', zIndex: 1 }}
      >
        <h1 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: 'clamp(2.5rem, 6vw, 6rem)', 
          lineHeight: 1.05, 
          margin: 0, 
          letterSpacing: '-0.03em',
        }}>
          Think <span className="italic" style={{ opacity: 0.5 }}>in</span> Decades.<br/>
          Execute in <span style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', padding: '0 0.2em', display: 'inline-block', lineHeight: 1 }}>Days.</span>
        </h1>
      </motion.div>

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        
        {/* Input Form */}
        <div style={{ marginBottom: '3rem', display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <form onSubmit={addGoal} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <input 
              type="text" 
              placeholder="What is your lifetime goal?" 
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '2px solid var(--border-color)', fontSize: '1.25rem', padding: '0.5rem', color: 'var(--text-color)', outline: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="date" 
                value={newGoalTargetDate}
                onChange={(e) => setNewGoalTargetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', padding: '0.5rem', color: 'var(--text-color)', outline: 'none' }}
              />
            </div>
            <button 
              type="submit"
              className="interactive"
              style={{ background: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', borderRadius: '999px', padding: '0.5rem 1.5rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Commit
            </button>
          </form>
        </div>

        {/* Closest Goal Dashboard */}
        {(() => {
          if (!user) {
            return (
              <div 
                className="interactive"
                style={{ 
                  marginBottom: '4rem', 
                  padding: '6rem 2rem', 
                  borderRadius: '32px', 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Blurred mockup of dashboard */}
                <div style={{ filter: 'blur(12px)', opacity: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', userSelect: 'none' }}>
                  <h2 style={{ fontSize: '10rem', margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 900 }}>59</h2>
                  <span style={{ fontSize: '1.25rem', letterSpacing: '0.4em', textTransform: 'uppercase' }}>Days Left</span>
                  <h3 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Sample Goal</h3>
                </div>
                
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, width: '100%' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '1rem', color: 'var(--accent-red)' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Execute Pro Required</h3>
                  <p style={{ opacity: 0.7, marginBottom: '2rem', textAlign: 'center', maxWidth: '400px', fontSize: '1.1rem', lineHeight: 1.5 }}>
                    Sign in to unlock the Long-Term Dashboard and sync your goals across all devices.
                  </p>
                  <button 
                    onClick={async () => {
                      try {
                        await loginWithGoogle();
                      } catch (e) {
                        console.error("Login failed", e);
                      }
                    }}
                    className="interactive"
                    style={{ background: 'var(--text-color)', color: 'var(--bg-color)', padding: '1rem 3rem', border: 'none', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    Unlock Pro
                  </button>
                </div>
              </div>
            );
          }

          const incompleteGoals = goals.filter(g => !g.isCompleted);
          if (incompleteGoals.length === 0) return null;
          
          const closestGoal = incompleteGoals.reduce((closest, g) => {
            const daysLeftG = Math.max(0, g.targetDays - getDaysPassed(g.startDate));
            const daysLeftClosest = Math.max(0, closest.targetDays - getDaysPassed(closest.startDate));
            return daysLeftG < daysLeftClosest ? g : closest;
          });

          const daysPassed = getDaysPassed(closestGoal.startDate);
          const daysLeft = Math.max(0, closestGoal.targetDays - daysPassed);
          const progress = Math.min(100, (daysPassed / closestGoal.targetDays) * 100);

          return (
            <motion.div 
              onClick={() => setActiveGoal(closestGoal)}
              className="interactive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, boxShadow: `0 30px 60px ${daysLeft <= 10 ? 'rgba(255, 69, 58, 0.15)' : 'rgba(212, 245, 54, 0.05)'}` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ 
                marginBottom: '4rem', 
                padding: '6rem 2rem', 
                borderRadius: '32px', 
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 20px 40px ${daysLeft <= 10 ? 'rgba(255, 69, 58, 0.1)' : 'rgba(0,0,0,0.5)'}`
              }}
            >
              {/* Animated Glow Behind Number */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  width: '300px',
                  height: '300px',
                  background: daysLeft <= 10 ? 'radial-gradient(circle, rgba(255,69,58,0.4) 0%, rgba(255,69,58,0) 70%)' : 'radial-gradient(circle, rgba(212,245,54,0.15) 0%, rgba(212,245,54,0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0,
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              />
              
              <CollageBackground mediaList={closestGoal.media || []} />

              <h2 style={{ 
                fontSize: 'clamp(8rem, 20vw, 16rem)', 
                lineHeight: 0.9, 
                margin: 0, 
                fontFamily: 'var(--font-sans)', 
                fontWeight: 900,
                color: 'transparent',
                WebkitTextStroke: `2px ${daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)'}`,
                backgroundImage: daysLeft <= 10 ? 'linear-gradient(180deg, var(--accent-red) 0%, transparent 100%)' : 'linear-gradient(180deg, var(--text-color) 0%, transparent 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                letterSpacing: '-0.05em',
                zIndex: 1,
                position: 'relative'
              }}>
                {daysLeft}
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '3rem', zIndex: 1, position: 'relative' }}>
                <div style={{ height: '1px', width: '40px', background: daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)', opacity: 0.5 }}></div>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4em', color: daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)' }}>
                  Days Left
                </span>
                <div style={{ height: '1px', width: '40px', background: daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)', opacity: 0.5 }}></div>
              </div>
              
              <h3 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', margin: 0, textAlign: 'center', zIndex: 1, position: 'relative', color: 'var(--text-color)', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {closestGoal.title}
              </h3>
              
              {/* Premium glowing progress bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, height: '6px', width: '100%', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)', 
                  boxShadow: `0 0 20px ${daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)'}, 0 0 10px ${daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)'}`,
                  transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)' 
                }} />
              </div>
            </motion.div>
          );
        })()}

        {/* Calendar View */}
        <CalendarView goals={goals} onSelectGoal={setActiveGoal} />

        {/* Goals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AnimatePresence>
            {goals.map(goal => {
              const daysPassed = getDaysPassed(goal.startDate);
              const daysLeft = Math.max(0, goal.targetDays - daysPassed);
              const progress = Math.min(100, (daysPassed / goal.targetDays) * 100);

              return (
                <motion.div 
                  key={goal.id}
                  onClick={() => setActiveGoal(goal)}
                  className="interactive"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '16px', 
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-color)',
                    cursor: 'pointer'
                  }}
                >
                  {/* Progress Bar Background */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: goal.isCompleted ? 'var(--accent-green)' : 'var(--accent-red)', transition: 'width 1s ease' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleGoal(goal.id); }}
                        className="interactive"
                        style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          border: `2px solid ${goal.isCompleted ? 'var(--accent-green)' : 'var(--border-color)'}`,
                          backgroundColor: goal.isCompleted ? 'var(--accent-green)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                      >
                        {goal.isCompleted && <span style={{ color: 'var(--bg-color)', fontWeight: 'bold' }}>✓</span>}
                      </button>
                      
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-serif)', textDecoration: goal.isCompleted ? 'line-through' : 'none', opacity: goal.isCompleted ? 0.5 : 1 }}>
                          {goal.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>
                          Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'N/A'} • {goal.targetDays} Day Challenge
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      {!goal.isCompleted && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)', color: daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)' }}>
                            {daysLeft}
                          </span>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>Days Left</span>
                        </div>
                      )}
                      {goal.isCompleted && (
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>ACHIEVED</span>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                        className="interactive"
                        style={{ background: 'transparent', border: 'none', opacity: 0.5, cursor: 'pointer', fontSize: '1.5rem' }}
                        title="Delete Goal"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {goals.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, fontStyle: 'italic', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
              No long-term goals set. Think decades, execute days.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveGoal(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              zIndex: 100, display: 'flex', justifyContent: 'flex-end'
            }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-color)',
                borderLeft: '1px solid var(--border-color)', padding: '3rem',
                display: 'flex', flexDirection: 'column', position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', lineHeight: 1.1, margin: '0 0 0.5rem 0' }}>{activeGoal.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--dim-text)', letterSpacing: '0.1em' }}>Target:</span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-sans)', color: 'var(--text-color)' }}>{activeGoal.targetDate} ({activeGoal.targetDays} Days)</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="interactive"
                    onClick={() => {
                      const newId = mainFocusId === String(activeGoal.id) ? '' : String(activeGoal.id);
                      localStorage.setItem('execute_pro_main_focus', newId);
                      setMainFocusId(newId);
                      window.dispatchEvent(new CustomEvent('mainFocusUpdated'));
                    }}
                    style={{ 
                      cursor: 'pointer', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', 
                      borderRadius: '4px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                      backgroundColor: mainFocusId === String(activeGoal.id) ? 'var(--text-color)' : 'transparent',
                      color: mainFocusId === String(activeGoal.id) ? 'var(--bg-color)' : 'var(--text-color)',
                      display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                    }}
                  >
                    ⭐ {mainFocusId === String(activeGoal.id) ? 'Focused' : 'Focus'}
                  </button>
                  <label className="interactive" style={{ 
                    cursor: 'pointer', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', 
                    borderRadius: '4px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Media
                    <input type="file" style={{ display: 'none' }} accept="image/*,video/*,application/pdf" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div 
                style={{ 
                  flex: 1, position: 'relative', overflow: 'hidden', 
                  borderRadius: '8px',
                  backgroundColor: isDraggingOver ? 'rgba(212, 245, 54, 0.05)' : 'transparent',
                  border: isDraggingOver ? '1px dashed #D4F536' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
              >
                <textarea
                  autoFocus
                  placeholder="Add goal details..."
                  value={activeGoal.details || ''}
                  onChange={e => updateGoalDetails(activeGoal.id, e.target.value)}
                  style={{
                    width: '100%', height: '100%', backgroundColor: 'transparent', border: 'none', resize: 'none',
                    outline: 'none', color: 'var(--text-color)', fontSize: '1.1rem',
                    fontFamily: 'var(--font-serif)', lineHeight: '1.6', position: 'absolute', top: 0, left: 0, zIndex: 1
                  }}
                />
                
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, pointerEvents: 'none' }}>
                  {(activeGoal.media || []).map(m => (
                    <MediaElement 
                      key={m.id} 
                      media={m} 
                      onUpdate={(newPos) => {
                        const newMedia = (activeGoal.media || []).map(item => item.id === m.id ? { ...item, ...newPos } : item);
                        setGoals(prev => prev.map(g => g.id === activeGoal.id ? { ...g, media: newMedia } : g));
                        setActiveGoal(prev => ({ ...prev, media: newMedia }));
                      }}
                      onDelete={() => deleteMedia(activeGoal.id, m.id)}
                      onBringToFront={() => bringToFront(activeGoal.id, m.id)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function MediaElement({ media, onUpdate, onDelete, onBringToFront }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let url = null;
    getMediaBlob(media.id).then(blob => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [media.id]);

  if (!blobUrl) return null;

  const renderContent = () => {
    if (!media || !media.type) return <div style={{ color: '#fff', padding: '1rem' }}>Unsupported Media</div>;
    if (media.type.startsWith('image/')) return <img src={blobUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} draggable={false} />;
    if (media.type.startsWith('video/')) return <video src={blobUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    if (media.type === 'application/pdf') return <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' }} />;
    return <div style={{ color: '#fff', padding: '1rem' }}>Unsupported Media</div>;
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: media.x || 0, y: media.y || 0 }}
      onDragEnd={(e, info) => onUpdate({ x: media.x + info.offset.x, y: media.y + info.offset.y })}
      onPointerDown={onBringToFront}
      style={{
        position: 'absolute',
        width: media.width || 250,
        height: media.height || 250,
        zIndex: media.zIndex || 1,
        pointerEvents: 'auto', 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        resize: 'both'
      }}
    >
      <button 
        onClick={onDelete} 
        style={{ 
          position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', 
          borderRadius: '50%', width: 24, height: 24, color: 'white', border: 'none', 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 
        }}
      >
        ×
      </button>
      {renderContent()}
    </motion.div>
  );
}

function CollageBackground({ mediaList }) {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    let active = true;
    const loadedUrls = [];
    
    const loadImages = async () => {
      for (const m of mediaList || []) {
        if (m.type && m.type.startsWith('image/')) {
          const blob = await getMediaBlob(m.id);
          if (blob && active) {
            const url = URL.createObjectURL(blob);
            loadedUrls.push({ id: m.id, url });
            setUrls([...loadedUrls]);
          }
        }
      }
    };
    
    loadImages();
    
    return () => {
      active = false;
      loadedUrls.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [mediaList]);

  if (urls.length === 0) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', opacity: 0.6, pointerEvents: 'none' }}>
      {urls.map((item, i) => {
        const positions = [
          { top: '-20%', left: '-20%', width: '80%', height: '90%' },
          { bottom: '-20%', right: '-15%', width: '85%', height: '90%' },
          { top: '-10%', right: '-20%', width: '75%', height: '85%' },
          { bottom: '-25%', left: '-10%', width: '90%', height: '85%' },
          { top: '10%', left: '10%', width: '80%', height: '80%' },
          { top: '5%', right: '5%', width: '70%', height: '90%' }
        ];
        const pos = positions[i % positions.length];
        return (
          <motion.img 
            initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? 1 : -1) * (15 + (i * 17) % 40) }}
            transition={{ duration: 1, delay: i * 0.1, type: 'spring', bounce: 0.2 }}
            key={item.id} 
            src={item.url} 
            style={{ 
              position: 'absolute', 
              ...pos, 
              objectFit: 'cover',
              borderRadius: '32px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              zIndex: i
            }} 
          />
        );
      })}
    </div>
  );
}

function ClassicCalendarView({ goals, onSelectGoal }) {
  const { tasks } = useContext(AppContext) || { tasks: [] };
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = currentMonth.getDay();

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div style={{ 
      marginBottom: '4rem', 
      padding: '3vw', 
      borderRadius: '32px', 
      background: 'linear-gradient(145deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.03) 100%)', 
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.05)' 
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-color)' }}>
          {monthNames[currentMonth.getMonth()]} <span style={{ opacity: 0.5 }}>{currentMonth.getFullYear()}</span>
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '12px' }}>
          <button onClick={prevMonth} className="interactive" style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-color)', fontWeight: 'bold' }}>&larr;</button>
          <button onClick={nextMonth} className="interactive" style={{ padding: '0.5rem 1rem', background: 'var(--text-color)', border: 'none', color: 'var(--bg-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>&rarr;</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-color)', opacity: 0.5 }}>
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} style={{ opacity: 0 }}></div>;
          
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const dStr = `${yyyy}-${mm}-${dd}`;
          const cellDate = new Date(yyyy, d.getMonth(), d.getDate());
          
          const goalsOnDay = goals.filter(g => {
            if (!g.targetDate) return false;
            
            const [tY, tM, tD] = g.targetDate.split('-');
            const end = new Date(parseInt(tY, 10), parseInt(tM, 10) - 1, parseInt(tD, 10));
            end.setHours(23, 59, 59, 999);

            let start;
            if (g.startDate) {
                const datePart = g.startDate.substring(0, 10);
                const [sY, sM, sD] = datePart.split('-');
                start = new Date(parseInt(sY, 10), parseInt(sM, 10) - 1, parseInt(sD, 10));
            } else {
                start = new Date(end.getTime());
                if (g.targetDays) {
                    start.setDate(start.getDate() - g.targetDays);
                }
            }
            start.setHours(0, 0, 0, 0);

            return cellDate >= start && cellDate <= end;
          });
          const tasksOnDay = (tasks || []).filter(t => {
            const tDateStr = t.deadline || t.createdAt;
            if (!tDateStr) return false;
            let tDate;
            if (tDateStr.includes('T')) {
                tDate = new Date(tDateStr);
            } else if (tDateStr.includes('-')) {
                const parts = tDateStr.split('-');
                if (parts.length === 3) {
                    tDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                } else {
                    tDate = new Date(tDateStr);
                }
            } else {
                tDate = new Date(tDateStr);
            }
            return tDate.getFullYear() === d.getFullYear() && tDate.getMonth() === d.getMonth() && tDate.getDate() === d.getDate();
          });
          const isToday = dStr === todayStr;
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <motion.div key={i} 
              whileHover={{ scale: 1.02, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.03)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
              style={{ 
                backgroundColor: isToday ? 'var(--text-color)' : 'var(--bg-color)', 
                minHeight: '140px', 
                padding: '1rem', 
                borderRadius: '16px',
                border: isToday ? '1px solid var(--text-color)' : '1px solid rgba(0,0,0,0.05)',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem',
                opacity: isPast && !isToday ? 0.6 : 1,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: '1.25rem', 
                  fontFamily: 'var(--font-serif)',
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isToday ? 'var(--bg-color)' : 'var(--text-color)',
                  backgroundColor: 'transparent',
                  padding: '4px',
                }}>
                  {d.getDate()}
                </span>
                {(goalsOnDay.length > 0 || tasksOnDay.length > 0) && (
                   <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isToday ? 'var(--bg-color)' : 'var(--text-color)', marginTop: '8px', marginRight: '4px' }}></span>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto', marginTop: '0.5rem' }}>
                {goalsOnDay.map(g => (
                  <div 
                    key={`goal-${g.id}`} 
                    onClick={() => onSelectGoal(g)}
                    className="interactive"
                    style={{ 
                      fontSize: '0.75rem', 
                      background: g.isCompleted ? (isToday ? 'var(--bg-color)' : 'var(--text-color)') : 'var(--accent-orange)', 
                      color: g.isCompleted ? (isToday ? 'var(--text-color)' : 'var(--bg-color)') : 'var(--bg-color)', 
                      padding: '6px 10px', 
                      borderRadius: '6px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={`Goal: ${g.title}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                    {g.title}
                  </div>
                ))}
                {tasksOnDay.map(t => (
                  <div 
                    key={`task-${t.id}`}
                    onClick={() => window.location.hash = '#/tasks'}
                    className="interactive"
                    style={{ 
                      fontSize: '0.75rem', 
                      background: t.completed ? (isToday ? 'rgba(255,255,255,0.2)' : 'var(--text-color)') : 'transparent',
                      border: `1px solid ${isToday ? 'var(--bg-color)' : 'var(--text-color)'}`,
                      color: t.completed ? (isToday ? 'var(--bg-color)' : 'var(--bg-color)') : (isToday ? 'var(--bg-color)' : 'var(--text-color)'), 
                      padding: '6px 10px', 
                      borderRadius: '6px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      opacity: t.completed ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title={`Task: ${t.text}`}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1px solid ${isToday ? 'var(--bg-color)' : 'var(--text-color)'}`, backgroundColor: t.completed ? (isToday ? 'var(--bg-color)' : 'var(--bg-color)') : 'transparent', flexShrink: 0 }}></div>
                    {t.text}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ProCalendarView({ goals, onSelectGoal, theme }) {
  const { tasks } = useContext(AppContext) || { tasks: [] };
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const setToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    let day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 = Monday for grid
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const calendarCells = [];
  
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remaining = 42 - calendarCells.length;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const today = new Date();
  
  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const getEventsForDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dStr = `${yyyy}-${mm}-${dd}`;
    
    const cellDate = new Date(yyyy, d.getMonth(), d.getDate());
    
    const goalsOnDay = goals.filter(g => {
      if (!g.targetDate) return false;
      
      const [tY, tM, tD] = g.targetDate.split('-');
      const end = new Date(parseInt(tY, 10), parseInt(tM, 10) - 1, parseInt(tD, 10));
      end.setHours(23, 59, 59, 999);

      let start;
      if (g.startDate) {
          const datePart = g.startDate.substring(0, 10);
          const [sY, sM, sD] = datePart.split('-');
          start = new Date(parseInt(sY, 10), parseInt(sM, 10) - 1, parseInt(sD, 10));
      } else {
          start = new Date(end.getTime());
          if (g.targetDays) {
              start.setDate(start.getDate() - g.targetDays);
          }
      }
      start.setHours(0, 0, 0, 0);

      return cellDate >= start && cellDate <= end;
    }).map(g => ({ ...g, type: 'goal' }));
    const tasksOnDay = (tasks || []).filter(t => {
      const tDateStr = t.deadline || t.createdAt;
      if (!tDateStr) return false;
      let tDate;
      if (tDateStr.includes('T')) {
          tDate = new Date(tDateStr);
      } else if (tDateStr.includes('-')) {
          const parts = tDateStr.split('-');
          if (parts.length === 3) {
              tDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          } else {
              tDate = new Date(tDateStr);
          }
      } else {
          tDate = new Date(tDateStr);
      }
      return tDate.getFullYear() === yyyy && tDate.getMonth() === (d.getMonth()) && tDate.getDate() === d.getDate();
    }).map(t => ({ ...t, type: 'task' }));
    
    return [...goalsOnDay, ...tasksOnDay];
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const selectedDateStr = `${dayNames[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}DAY, ${monthNames[selectedDate.getMonth()].substring(0,3).toUpperCase()} ${selectedDate.getDate()}`;

  const localBg = theme === 'dark' ? '#111' : '#fff';
  const localText = theme === 'dark' ? '#fff' : '#111';
  const localAccent = theme === 'dark' ? '#D4F536' : '#000';

  return (
    <div style={{ 
      marginBottom: '4rem', 
      borderRadius: '24px', 
      background: localBg, 
      color: localText,
      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      
      {/* Header Controls */}
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={prevMonth} className="interactive" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'transparent', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, color: localText, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={nextMonth} className="interactive" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'transparent', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, color: localText, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: localText, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {monthNames[month]} {year}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` }}>
            {['Month', 'Week', 'Day'].map(tab => (
              <button 
                key={tab} 
                className="interactive"
                style={{ 
                  padding: '0.5rem 1.2rem', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', 
                  borderRight: tab !== 'Day' ? `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` : 'none',
                  background: tab === 'Month' ? localText : 'transparent',
                  color: tab === 'Month' ? localBg : localText
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={setToday} className="interactive" style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', background: localAccent, border: 'none', color: theme === 'dark' ? '#000' : '#fff', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> TODAY
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: '800px' }}>
        
        {/* Main Grid Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            {dayNames.map(day => (
              <div key={day} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.1em', opacity: 0.7, borderRight: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: localText }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, 1fr)', flex: 1 }}>
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.date);
              const isSelected = isSameDay(cell.date, selectedDate);
              const isToday = isSameDay(cell.date, today);
              
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDate(cell.date)}
                  className="interactive" 
                  style={{ 
                    padding: '0.75rem', 
                    opacity: cell.isCurrentMonth ? 1 : 0.3,
                    backgroundColor: isSelected ? (theme === 'dark' ? 'rgba(212, 245, 54, 0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    borderRight: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                  }}
                >
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold',
                    color: isToday ? localBg : localText,
                    backgroundColor: isToday ? (theme === 'dark' ? localAccent : localText) : 'transparent',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontFamily: 'var(--font-serif)',
                    border: isSelected && !isToday ? `1px solid ${localText}` : 'none'
                  }}>
                    {cell.date.getDate()}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto' }}>
                    {dayEvents.slice(0, 4).map((ev, i) => {
                       const dotColor = ev.type === 'goal' ? '#FFB432' : (ev.completed ? localText : (theme === 'dark' ? '#D4F536' : '#000'));
                       const title = ev.type === 'goal' ? ev.title : ev.text;
                       return (
                         <div key={i} style={{ display: 'flex', flexDirection: 'column', opacity: ev.completed ? 0.5 : 1 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 'bold', color: localText }}>
                             <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }}></span>
                             <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                           </div>
                           <div style={{ fontSize: '0.65rem', opacity: 0.5, marginLeft: '0.8rem', color: localText }}>
                             {ev.type === 'goal' ? 'All Day' : (ev.deadline ? new Date(ev.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending')}
                           </div>
                         </div>
                       );
                    })}
                    {dayEvents.length > 4 && (
                      <div style={{ fontSize: '0.7rem', opacity: 0.5, paddingLeft: '0.8rem', fontWeight: 'bold', color: localText }}>
                        +{dayEvents.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar Agenda */}
        <div style={{ width: '320px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', borderLeft: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
          
          {/* Mini Calendar */}
          <div style={{ backgroundColor: localBg, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: localText }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{monthNames[month]} {year}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={prevMonth} className="interactive" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: localText, opacity: 0.7 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                <button onClick={nextMonth} className="interactive" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: localText, opacity: 0.7 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, marginBottom: '1rem', color: localText }}>
              {['M','T','W','T','F','S','S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: localText }}>
              {calendarCells.map((cell, idx) => {
                const isSel = isSameDay(cell.date, selectedDate);
                const isTod = isSameDay(cell.date, today);
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDate(cell.date)}
                    className="interactive"
                    style={{ 
                      padding: '0.4rem 0',
                      opacity: cell.isCurrentMonth ? 1 : 0.2,
                      color: isSel ? localBg : (isTod ? localAccent : 'inherit'),
                      backgroundColor: isSel ? localText : 'transparent',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontWeight: isSel || isTod ? 'bold' : 'normal'
                    }}
                  >
                    {cell.date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#D4F536' : '#111', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', fontWeight: 'bold' }}>
              {selectedDateStr}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              {selectedDateEvents.length === 0 ? (
                <div style={{ opacity: 0.5, fontSize: '0.9rem', fontStyle: 'italic', color: localText }}>No events scheduled.</div>
              ) : (
                selectedDateEvents.map((ev, i) => {
                  const dotColor = ev.type === 'goal' ? '#FFB432' : (ev.completed ? localText : (theme === 'dark' ? '#D4F536' : '#000'));
                  const title = ev.type === 'goal' ? ev.title : ev.text;
                  const timeStr = ev.type === 'goal' ? 'All Day' : (ev.deadline ? new Date(ev.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending');

                  return (
                    <div key={i} className="interactive" onClick={() => ev.type === 'goal' && onSelectGoal(ev)} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: i < selectedDateEvents.length - 1 ? `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none', paddingBottom: i < selectedDateEvents.length - 1 ? '1.5rem' : 0, cursor: 'pointer', opacity: ev.completed ? 0.5 : 1 }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 'bold', color: localText }}>{timeStr}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontWeight: 'bold', fontSize: '0.9rem', color: localText, lineHeight: 1.3 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor, marginTop: '4px', flexShrink: 0 }}></span>
                          {title}
                        </div>
                        {ev.type === 'goal' && (
                           <div style={{ fontSize: '0.65rem', opacity: 0.5, color: localText, textTransform: 'uppercase', letterSpacing: '1px', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, padding: '2px 6px', borderRadius: '4px' }}>Goal</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button className="interactive" style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px', background: localText, color: localBg, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', width: '100%', border: 'none', cursor: 'pointer' }}>
              View Full Schedule 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function CalendarView({ goals, onSelectGoal }) {
  const [template, setTemplateState] = useState(() => {
    return localStorage.getItem('calendar_template') || 'classic';
  });

  const setTemplate = (newTemplate) => {
    setTemplateState(newTemplate);
    localStorage.setItem('calendar_template', newTemplate);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', gap: '0.75rem' }}>
        <button 
          onClick={() => setTemplate('classic')} 
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 'bold', background: template === 'classic' ? 'var(--text-color)' : 'transparent', color: template === 'classic' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--text-color)', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Classic View
        </button>
        <button 
          onClick={() => setTemplate('dark')} 
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 'bold', background: template === 'dark' ? 'var(--text-color)' : 'transparent', color: template === 'dark' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--text-color)', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Template 1 (Dark)
        </button>
        <button 
          onClick={() => setTemplate('light')} 
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 'bold', background: template === 'light' ? 'var(--text-color)' : 'transparent', color: template === 'light' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--text-color)', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Template 2 (Light)
        </button>
      </div>
      
      {template === 'classic' && <ClassicCalendarView goals={goals} onSelectGoal={onSelectGoal} />}
      {template === 'dark' && <ProCalendarView goals={goals} onSelectGoal={onSelectGoal} theme="dark" />}
      {template === 'light' && <ProCalendarView goals={goals} onSelectGoal={onSelectGoal} theme="light" />}
    </div>
  );
}

export default Goals;
