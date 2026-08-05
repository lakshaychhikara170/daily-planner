import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function Home() {
  const [tasks, setTasks] = useState([]);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);

  useEffect(() => {
    const savedTasks = localStorage.getItem('dailyPlannerTasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedSchedule = localStorage.getItem('dailyPlannerScheduleV2');
    if (savedSchedule) setScheduleBlocks(JSON.parse(savedSchedule));
  }, []);
  
  const scheduleHours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 to 18

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 'calc(100vh - 80px)',
      backgroundColor: 'var(--bg-color)'
    }}>
      
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
            fontSize: 'clamp(4rem, 8vw, 8rem)', 
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1 }}>
        
        {/* LEFT COLUMN: Tasks */}
        <div 
          className="interactive"
          onClick={() => window.location.hash = '#/tasks'}
          style={{ 
            backgroundColor: 'var(--bg-color)',
            padding: '4vw',
            borderRight: '1px solid var(--border-color)',
            
            transition: 'background-color 0.3s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
        >
          {/* Arrow Button Top Right */}
          <div style={{ 
            position: 'absolute', 
            top: '4vw', 
            right: '4vw', 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            border: '1px solid var(--border-color)', 
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
            
            transition: 'background-color 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
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

      {/* ROW 3 - Features (New Section) */}
      <div style={{ padding: '6vw 4vw', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ color: 'var(--text-color)' }}>●</span>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>04 / Toolset</span>
          </div>
          
          <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '4rem', letterSpacing: '-0.02em' }}>
            Advanced <span className="italic">Execution.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '3rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Deep Work Timer</h3>
              <p style={{ opacity: 0.7, fontSize: '1rem', lineHeight: 1.6 }}>Open any task and start a full-screen, 25-minute focus session that blocks out all distractions.</p>
            </div>
            
            <div 
              className="interactive"
              onClick={() => window.location.hash = '#/review'}
              style={{ padding: '3rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', }}
            >
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Review Dashboard &rarr;</h3>
              <p style={{ opacity: 0.8, fontSize: '1rem', lineHeight: 1.6 }}>Track your task velocity, habit consistency, and log your weekly reflections.</p>
            </div>

            <div 
              className="interactive"
              onClick={() => window.location.hash = '#/routines'}
              style={{ padding: '3rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', }}
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
  );
}

export default Home;
