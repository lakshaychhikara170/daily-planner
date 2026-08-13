import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { Target, CheckCircle2, Clock, Zap, Star } from 'lucide-react';
import { getMediaBlob } from '../utils/storage';

const getDateStr = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getDaysPassed = (startDateStr) => {
  const start = new Date(startDateStr);
  const diffTime = Math.abs(new Date() - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

function Home() {
  const { user, isPro } = useContext(AuthContext);
  const { streak, points, levelInfo } = useContext(AppContext);

  const [tasks, setTasks] = useState([]);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [timerStyle, setTimerStyle] = useState(() => localStorage.getItem('home_timer_style') || 'cinematic');

  const toggleTimerStyle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = timerStyle === 'compact' ? 'cinematic' : 'compact';
    setTimerStyle(next);
    localStorage.setItem('home_timer_style', next);
  };

  const dashboardRef = useRef(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem('dailyPlannerTasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedSchedule = localStorage.getItem('dailyPlannerScheduleV2');
    if (savedSchedule) setScheduleBlocks(JSON.parse(savedSchedule));

    const savedGoals = localStorage.getItem('dailyPlannerGoals');
    if (savedGoals) setGoals(JSON.parse(savedGoals));

    const savedRoutines = localStorage.getItem('dailyPlannerRoutines');
    if (savedRoutines) setRoutines(JSON.parse(savedRoutines));
  }, []);



  // --- Widget Data Calculations ---
  const incompleteGoals = goals.filter(g => !g.isCompleted);
  const closestGoal = incompleteGoals.length > 0 
    ? incompleteGoals.reduce((closest, g) => {
        const daysLeftG = Math.max(0, g.targetDays - getDaysPassed(g.startDate));
        const daysLeftClosest = Math.max(0, closest.targetDays - getDaysPassed(closest.startDate));
        return daysLeftG < daysLeftClosest ? g : closest;
      })
    : null;

  const pendingTasks = tasks.filter(t => !t.completed);
  const nextTask = pendingTasks.length > 0 ? pendingTasks[0] : null;

  const activeBlock = scheduleBlocks.find(b => b.task);

  const todayStr = getDateStr(new Date());
  const activeRoutines = routines.filter(r => !r.isArchived);
  let completedRoutinesCount = 0;
  let expectedRoutinesCount = 0;
  
  activeRoutines.forEach(r => {
    if (r.history && r.history[todayStr] === true) completedRoutinesCount++;
    if (!r.history || r.history[todayStr] !== 'rest') expectedRoutinesCount++;
  });
  const routinesProgress = expectedRoutinesCount > 0 ? (completedRoutinesCount / expectedRoutinesCount) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-color)' }}>
      
      {/* --- ORIGINAL HOME PAGE CONTENT (Only show if NOT logged in, OR if user wants to keep it) --- */}
      {(!user || localStorage.getItem('keepLandingPage') === 'true') && (
        <main style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* ROW 1 - FULL WIDTH: Big Header */}
          <div style={{ 
            padding: '6vw 4vw', 
            borderBottom: '1px solid var(--border-color)',
            position: 'relative' 
          }}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ maxWidth: '1600px', margin: '0 auto' }}
            >
              <h1 style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: 'clamp(2.5rem, 8vw, 8rem)', 
                lineHeight: 1.05, 
                margin: 0, 
                letterSpacing: '-0.03em',
                color: 'var(--text-color)'
              }}>
                A planner that <span className="italic" style={{ opacity: 0.6 }}>doesn't</span> whisper.<br/>
                It speaks <span style={{ backgroundColor: 'var(--accent-green)', padding: '0 0.2em', display: 'inline-block', lineHeight: 1 }}>Focus.</span>
              </h1>
            </motion.div>
          </div>

          {/* ROW 2 - SPLIT GRID */}
          <div className="grid-responsive" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            
            {/* LEFT COLUMN: Tasks */}
            <div 
              className="interactive"
              onClick={() => window.location.hash = '#/tasks'}
              style={{ 
                backgroundColor: 'var(--bg-color)',
                padding: '4vw',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background-color 0.3s ease',
                position: 'relative',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
            >
              <div style={{ 
                position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', 
                background: 'radial-gradient(circle at top right, rgba(0,0,0,0.03) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}></div>
              
              <div style={{ 
                position: 'absolute', 
                top: '4vw', 
                right: '4vw', 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                border: '1px solid var(--text-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                opacity: 0.7
              }}>
                <span style={{ fontSize: '1.2rem', transform: 'rotate(-45deg)' }}>→</span>
              </div>

              <div style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
                  <span style={{ color: 'var(--accent-orange)' }}>●</span>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>01 / Action Items</span>
                </div>
                
                <h3 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                  Tasks that <span className="italic">pay back.</span>
                </h3>
                <p style={{ opacity: 0.7, marginBottom: '3rem', maxWidth: '400px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  Focus on the high-leverage activities. We obsess over completion, momentum, and everything below the click.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2rem' }}>
                  {tasks.length === 0 && (
                    <div style={{ opacity: 0.5, fontStyle: 'italic', padding: '1rem 0' }}>No pending tasks right now.</div>
                  )}
                  {tasks.map(task => (
                    <div key={task.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.5rem',
                      padding: '1.25rem 0',
                      borderBottom: '1px solid var(--border-color)',
                      opacity: task.completed ? 0.5 : 1
                    }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        border: '1px solid var(--text-color)',
                        backgroundColor: task.completed ? 'var(--text-color)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--bg-color)',
                        flexShrink: 0
                      }}>
                        {task.completed && '✓'}
                      </div>
                      <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Schedule */}
            <div 
              className="interactive"
              onClick={() => window.location.hash = '#/schedule'}
              style={{ 
                backgroundColor: 'var(--text-color)', 
                color: 'var(--bg-color)',
                padding: '4vw',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background-color 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--text-color)'}
            >
              {/* Glow effect */}
              <div style={{ 
                position: 'absolute', 
                top: '20%', 
                left: '10%', 
                width: '400px', 
                height: '400px', 
                backgroundColor: 'var(--accent-green)', 
                filter: 'blur(120px)', 
                opacity: 0.15,
                borderRadius: '50%',
                zIndex: 0
              }}></div>

              {/* Arrow Button Top Right */}
              <div style={{ 
                position: 'absolute', 
                top: '4vw', 
                right: '4vw', 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--accent-green)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--bg-color)', 
                zIndex: 10 
              }}>
                <span style={{ fontSize: '1.2rem', transform: 'rotate(-45deg)' }}>→</span>
              </div>

              <div style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
                  <span style={{ color: 'var(--accent-green)' }}>●</span>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-green)' }}>02 / Schedule</span>
                </div>
                
                <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', letterSpacing: '-0.02em', color: 'white' }}>
                  Time you <span className="italic">actually use.</span>
                </h2>
                <p style={{ opacity: 0.7, marginBottom: '3rem', maxWidth: '400px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  Click any hour block to type your focus.
                </p>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem' }}>
                  {scheduleBlocks.length === 0 && (
                    <div style={{ opacity: 0.5, fontStyle: 'italic', padding: '1.5rem 0' }}>No schedule blocks set for today.</div>
                  )}
                  {scheduleBlocks.map(block => (
                    <div key={block.id} className="schedule-block" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', minHeight: '60px', pointerEvents: 'none', display: 'flex', alignItems: 'stretch' }}>
                      <div className="schedule-hour" style={{ opacity: 0.8, width: '120px', padding: '1rem 0', display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', marginRight: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
                        {block.time || '—'}
                      </div>
                      <div className="schedule-content" style={{ flex: 1, padding: '1rem 0', display: 'flex', alignItems: 'center' }}>
                        <span className={block.task ? "schedule-filled" : ""} style={{ fontSize: '1.25rem', opacity: block.task ? 1 : 0.3, fontStyle: block.task ? 'normal' : 'italic' }}>
                          {block.task || 'Empty block...'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        {/* ROW 3 - LONG TERM GOALS */}
        <div 
          className="interactive"
          onClick={() => window.location.hash = '#/goals'}
          style={{ padding: '6vw 4vw', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', cursor: 'pointer', transition: 'background-color 0.3s' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
        >
          <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '0', right: '0', width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
              <span style={{ fontSize: '1.2rem', transform: 'rotate(-45deg)' }}>→</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <span style={{ color: 'var(--accent-red)' }}>●</span>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>03 / Goals</span>
            </div>
            
            <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '4rem', letterSpacing: '-0.02em' }}>
              Think in <span className="italic">Decades.</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {goals.length === 0 && (
                <div style={{ opacity: 0.5, fontStyle: 'italic', padding: '1rem 0' }}>No long-term goals set. Click to add one.</div>
              )}
              {goals.filter(g => !g.isCompleted).map(goal => {
                const start = new Date(goal.startDate);
                const diffTime = Math.abs(new Date() - start);
                const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, goal.targetDays - daysPassed);
                const progress = Math.min(100, (daysPassed / goal.targetDays) * 100);

                return (
                  <div key={goal.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                      <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--accent-red)' }} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem 0' }}>{goal.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem' }}>
                      <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{goal.targetDays} Day Challenge</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)', color: daysLeft <= 10 ? 'var(--accent-red)' : 'var(--text-color)' }}>{daysLeft} <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>Days Left</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROW 4 - Features */}
        <div style={{ padding: '6vw 4vw', backgroundColor: 'var(--bg-color)' }}>
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <span style={{ color: 'var(--text-color)' }}>●</span>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>04 / Toolset</span>
            </div>
            
            <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '4rem', letterSpacing: '-0.02em' }}>
              Advanced <span className="italic">Execution.</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              <div style={{ padding: '3rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Deep Work Timer</h3>
                <p style={{ opacity: 0.7, fontSize: '1rem', lineHeight: 1.6 }}>Open any task and start a full-screen, 25-minute focus session that blocks out all distractions.</p>
              </div>
              
              <div 
                className="interactive"
                onClick={() => window.location.hash = '#/review'}
                style={{ padding: '3rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', cursor: 'pointer' }}
              >
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Review Dashboard &rarr;</h3>
                <p style={{ opacity: 0.8, fontSize: '1rem', lineHeight: 1.6 }}>Track your task velocity, habit consistency, and log your weekly reflections.</p>
              </div>

              <div 
                className="interactive"
                onClick={() => window.location.hash = '#/routines'}
                style={{ padding: '3rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Dynamic Reordering &rarr;</h3>
                <p style={{ opacity: 0.7, fontSize: '1rem', lineHeight: 1.6 }}>Drag and drop your tasks and routines to visually prioritize your high-leverage activities.</p>
              </div>

              <div style={{ padding: '3rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Universal Backup</h3>
                <p style={{ opacity: 0.7, fontSize: '1rem', lineHeight: 1.6 }}>Open the Settings (gear icon) in the top right to instantly export or import your data.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      )}

      {/* --- DASHBOARD CONTENT --- */}
      <section ref={dashboardRef} style={{ padding: '6vw 4vw', backgroundColor: '#050505', color: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', fontFamily: 'var(--font-serif)', margin: '0 0 1rem 0', lineHeight: 1, letterSpacing: '-0.03em', textTransform: 'capitalize' }}>
                  {user?.displayName || user?.email?.split('@')[0] || 'Dashboard'}.
                </h1>
                <p style={{ opacity: 0.5, fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Pro Dashboard
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-sans)', fontWeight: 900, margin: 0 }}>Level {levelInfo?.level || 1}</h2>
                 <span style={{ color: 'var(--accent-green)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600 }}>{points || 0} XP</span>
              </div>
            </header>

            {/* Dashboard Grid */}
            <div className="bento-grid">

              {/* 1. HERO WIDGET: CLOSEST GOAL */}
              <motion.div 
                onClick={() => window.location.hash = '#/goals'}
                className="interactive bento-hero"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                style={{ 
                  padding: '3rem', 
                  borderRadius: '32px', 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                  // DYNAMIC LAYOUT BASED ON STYLE
                  gridColumn: timerStyle === 'compact' ? '1 / -1' : 'span 2',
                  gridRow: timerStyle === 'compact' ? 'span 1' : 'span 2',
                  minHeight: timerStyle === 'compact' ? '400px' : 'auto'
                }}
              >
                {closestGoal ? (
                  <>
                    <CollageBackground mediaList={closestGoal.media || []} />
                    
                    {/* Style toggle button */}
                    <button
                      onClick={toggleTimerStyle}
                      style={{
                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                        zIndex: 20, background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px',
                        color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        padding: '0.4rem 0.8rem', cursor: 'pointer',
                        backdropFilter: 'blur(6px)'
                      }}
                      title="Toggle timer style"
                    >
                      {timerStyle === 'compact' ? '⬛ Cinematic' : '🔲 Compact'}
                    </button>

                    {(() => {
                      const daysPassed = getDaysPassed(closestGoal.startDate);
                      const daysLeft = Math.max(0, closestGoal.targetDays - daysPassed);
                      const progress = Math.min(100, (daysPassed / closestGoal.targetDays) * 100);
                      const isDanger = daysLeft <= 10;
                      
                      return (
                        <>
                          {timerStyle === 'compact' ? (
                            /* ── Style 1: Original Design (Compact) ── */
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <h2 style={{ 
                                fontSize: 'clamp(6rem, 15vw, 10rem)', 
                                lineHeight: 0.9, 
                                margin: 0, 
                                fontFamily: 'var(--font-sans)', 
                                fontWeight: 900,
                                color: isDanger ? '#ff4444' : '#fff',
                                textShadow: '0 10px 20px rgba(0,0,0,0.6)',
                                letterSpacing: '-0.04em'
                              }}>
                                {daysLeft}
                              </h2>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
                                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4em', color: isDanger ? '#ff4444' : 'rgba(255,255,255,0.8)' }}>
                                  Days Left
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* ── Style 2: Cinematic big number ── */
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                              <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.25em', opacity: 0.8, marginBottom: '0.5rem', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                                Closest Deadline
                              </span>
                              <h2 style={{
                                fontSize: 'clamp(8rem, 25vw, 12rem)',
                                margin: 0, lineHeight: 0.85,
                                fontFamily: 'var(--font-sans)', fontWeight: 900,
                                color: isDanger ? '#ff4444' : '#fff',
                                textShadow: '0 4px 40px rgba(0,0,0,0.7)',
                                letterSpacing: '-0.04em'
                              }}>
                                {daysLeft}
                              </h2>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
                                <div style={{ height: '2px', width: '40px', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                <span style={{ fontSize: '1rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#fff', opacity: 0.9, textShadow: '0 2px 8px rgba(0,0,0,0.9)', fontWeight: 600 }}>Days Left</span>
                                <div style={{ height: '2px', width: '40px', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                              </div>
                            </div>
                          )}

                          <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', margin: 0, textAlign: 'center', zIndex: 1, textShadow: '0 10px 20px rgba(0,0,0,0.5)', color: '#fff', padding: '0 1rem' }}>
                            {closestGoal.title}
                          </h3>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '6px', width: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: isDanger ? '#ff4444' : '#ffffff' }} />
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div style={{ opacity: 0.5, textAlign: 'center' }}>
                    <Target size={64} style={{ marginBottom: '1.5rem', opacity: 0.5, display: 'block', margin: '0 auto 1.5rem auto' }} />
                    <h3 style={{ fontSize: '2rem' }}>No active long-term goals.</h3>
                    <p style={{ fontSize: '1.2rem' }}>Click to set one.</p>
                  </div>
                )}
              </motion.div>

              {/* 2. ACTION ITEMS WIDGET */}
              <motion.div 
                onClick={() => window.location.hash = '#/tasks'}
                className="interactive"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                style={{ 
                  padding: '2rem', 
                  borderRadius: '32px', 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>01 / Tasks</span>
                </div>
                <h2 style={{ fontSize: '4.5rem', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>{pendingTasks.length}</h2>
                <p style={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', marginBottom: 'auto' }}>Pending Action Items</p>
                
                {nextTask ? (
                  <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', borderLeft: '4px solid var(--accent-orange)' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '0.5rem' }}>Up Next</span>
                    <span style={{ fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 500, lineHeight: 1.4 }}>{nextTask.text}</span>
                  </div>
                ) : (
                  <div style={{ marginTop: '3rem', opacity: 0.4 }}>All caught up.</div>
                )}
              </motion.div>

              {/* 3. SCHEDULE WIDGET */}
              <motion.div 
                onClick={() => window.location.hash = '#/schedule'}
                className="interactive"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                style={{ 
                  padding: '2rem', 
                  borderRadius: '32px', 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={28} />
                  </div>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>02 / Schedule</span>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', margin: '0 0 1rem 0', lineHeight: 1.1 }}>Time you<br/><span className="italic" style={{ color: 'var(--accent-green)' }}>actually use.</span></h2>
                
                <div style={{ marginTop: 'auto', paddingTop: '3rem' }}>
                  {activeBlock ? (
                    <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', borderLeft: '4px solid var(--accent-green)' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-green)', display: 'block', marginBottom: '0.5rem' }}>{activeBlock.time} Block</span>
                      <span style={{ fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 500, lineHeight: 1.4 }}>{activeBlock.task}</span>
                    </div>
                  ) : (
                    <div style={{ opacity: 0.4 }}>No active schedule block.</div>
                  )}
                </div>
              </motion.div>

              {/* 4. ROUTINES WIDGET */}
              <motion.div 
                onClick={() => window.location.hash = '#/routines'}
                className="interactive"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                style={{ 
                  padding: '2rem', 
                  borderRadius: '32px', 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={28} />
                  </div>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>04 / Habits</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div>
                    <h2 style={{ fontSize: '4.5rem', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>{Math.round(routinesProgress)}%</h2>
                    <p style={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', margin: 0 }}>Daily Completion</p>
                  </div>
                  <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                    <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                      <circle 
                        cx="45" cy="45" r="40" fill="none" 
                        stroke="#ffffff" 
                        strokeWidth="8" 
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (routinesProgress / 100))}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                    </svg>
                  </div>
                </div>
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', opacity: 0.5 }}>
                  <span>{completedRoutinesCount} Done</span>
                  <span>{expectedRoutinesCount - completedRoutinesCount} Remaining</span>
                </div>
              </motion.div>
              
              {/* 5. GAMIFICATION/PROFILE WIDGET */}
              <motion.div 
                onClick={() => window.location.hash = '#/profile'}
                className="interactive"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                style={{ 
                  padding: '2rem', 
                  borderRadius: '32px', 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)' }}>
                    <Star size={28} />
                  </div>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>06 / Profile</span>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ opacity: 0.6, fontSize: '1.1rem' }}>Current Streak</span>
                    <span style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: streak?.count > 0 ? 'var(--accent-red)' : 'inherit' }}>{streak?.count || 0} 🔥</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem' }}>
                    <span style={{ opacity: 0.6, fontSize: '1.1rem' }}>XP Progress</span>
                    <span style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)' }}>{levelInfo?.xpRemaining || 0}</span>
                  </div>
                  <div style={{ position: 'relative', height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${levelInfo?.progress || 0}%`, backgroundColor: 'var(--accent-red)' }} />
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
      </section>

    </div>
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

export default Home;
