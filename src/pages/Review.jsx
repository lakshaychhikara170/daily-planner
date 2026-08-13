import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import MonthPicker from '../components/MonthPicker';
import { AppContext } from '../context/AppContext';

function Review() {
  const [tasks, setTasks] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [reviewNotes, setReviewNotes] = useState(() => localStorage.getItem('dailyPlannerReviewNotes') || '');
  
  const { levelInfo } = useContext(AppContext);
  
  const [currentDate] = useState(new Date());
  const [viewingYear, setViewingYear] = useState(currentDate.getFullYear());
  const [viewingMonth, setViewingMonth] = useState(currentDate.getMonth());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    const savedTasks = localStorage.getItem('dailyPlannerTasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedRoutines = localStorage.getItem('dailyPlannerRoutines');
    if (savedRoutines) setRoutines(JSON.parse(savedRoutines));
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyPlannerReviewNotes', reviewNotes);
  }, [reviewNotes]);

  // Global All-Time Data
  const completedTasksAllTime = tasks.filter(t => t.completed).length;
  
  // Monthly Data
  const monthlyTasks = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d.getFullYear() === viewingYear && d.getMonth() === viewingMonth;
  });
  const monthlyTasksCount = monthlyTasks.length;

  let monthlyHabitChecks = 0;
  let monthlyHabitExpected = 0;
  
  const daysInMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(viewingYear, viewingMonth, i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Don't penalize for days in the future
    const nowStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    if (dateStr > nowStr) continue;
    
    routines.forEach(r => {
      if (r.history && r.history[dateStr] === true) {
         monthlyHabitChecks++;
         monthlyHabitExpected++;
      } else if (!r.history || r.history[dateStr] !== 'rest') {
         monthlyHabitExpected++;
      }
    });
  }

  const monthlyConsistency = monthlyHabitExpected > 0 ? Math.round((monthlyHabitChecks / monthlyHabitExpected) * 100) : 0;

  return (
    <main className="px-content py-section">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ marginBottom: '12vh' }}
      >
        <h1 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: 'clamp(2.5rem, 8vw, 8rem)', 
          lineHeight: 1.05, 
          margin: 0, 
          letterSpacing: '-0.03em',
          color: 'var(--text-color)'
        }}>
          Look <span className="italic" style={{ opacity: 0.6 }}>Back</span> to Move<br/>
          <span style={{ backgroundColor: 'var(--accent-green)', padding: '0 0.2em', display: 'inline-block', lineHeight: 1, color: '#000' }}>Forward.</span>
        </h1>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
        <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
          {new Date(viewingYear, viewingMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Report
        </h2>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="interactive"
            onClick={() => setIsMonthPickerOpen(true)}
            style={{ 
              background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '50%',
              width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-color)',  transition: 'all 0.2s ease', outline: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--text-color)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ mixBlendMode: 'difference', color: '#fff' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </button>
          <MonthPicker 
            isOpen={isMonthPickerOpen} 
            onClose={() => setIsMonthPickerOpen(false)}
            viewingYear={viewingYear}
            setViewingYear={setViewingYear}
            viewingMonth={viewingMonth}
            setViewingMonth={setViewingMonth}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem' }}>
        {/* Insights Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--accent-orange)' }}>●</span>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Habits</span>
              </div>
              <div style={{ fontSize: '6rem', fontFamily: 'var(--font-serif)', lineHeight: 1, color: 'var(--accent-green)' }}>
                {monthlyConsistency}<span style={{ fontSize: '3rem', color: 'var(--dim-text)' }}>%</span>
              </div>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginTop: '1rem' }}>
                Consistency ({monthlyHabitChecks}/{monthlyHabitExpected} checks)
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--accent-orange)' }}>●</span>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tasks</span>
              </div>
              <div style={{ fontSize: '6rem', fontFamily: 'var(--font-serif)', lineHeight: 1, color: 'var(--text-color)' }}>
                {monthlyTasksCount}
              </div>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginTop: '1rem' }}>
                Completed this month
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', opacity: 0.5 }}>All-Time Metrics</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>Total Tasks Finished:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{completedTasksAllTime}</span>
            </div>
          </div>
        </div>

        {/* Brain Dump Panel */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '3rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '2rem' }}>Weekly Review</h3>
          <p style={{ opacity: 0.7, marginBottom: '2rem', lineHeight: 1.6 }}>What went well? What didn't? Dump your thoughts here before starting the next cycle.</p>
          <textarea
            className="interactive"
            placeholder="Start typing..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            style={{
              flex: 1, minHeight: '300px', backgroundColor: 'transparent', border: 'none', resize: 'vertical',
              outline: 'none', color: 'var(--text-color)', fontSize: '1.25rem',
              fontFamily: 'var(--font-serif)', lineHeight: '1.6', cursor: 'text'
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '4rem', padding: '4rem 0', borderTop: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: '3rem' }}>Trophy Room 🏆</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <Badge 
            title="Task Terminator" 
            desc="Complete 50 Tasks"
            icon="⚔️"
            unlocked={completedTasksAllTime >= 50}
            progress={completedTasksAllTime}
            target={50}
          />
          <Badge 
            title="Consistency King" 
            desc="Check 100 Habits"
            icon="👑"
            unlocked={monthlyHabitChecks >= 100} // all-time habits not tracked directly easily here, using monthly for now or just checking
            progress={monthlyHabitChecks}
            target={100}
          />
          <Badge 
            title="Apprentice" 
            desc="Reach Level 5"
            icon="🌱"
            unlocked={levelInfo && levelInfo.level >= 5}
            progress={levelInfo ? levelInfo.level : 1}
            target={5}
          />
          <Badge 
            title="Master" 
            desc="Reach Level 10"
            icon="⚡"
            unlocked={levelInfo && levelInfo.level >= 10}
            progress={levelInfo ? levelInfo.level : 1}
            target={10}
          />
        </div>
      </div>
    </main>
  );
}

function Badge({ title, desc, icon, unlocked, progress, target }) {
  return (
    <div style={{ 
      padding: '2rem', 
      backgroundColor: unlocked ? 'var(--text-color)' : 'var(--cell-bg)', 
      color: unlocked ? 'var(--bg-color)' : 'var(--text-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      opacity: unlocked ? 1 : 0.6,
      transition: 'transform 0.3s ease',
      cursor: 'default'
    }}
    onMouseEnter={e => { if (unlocked) e.currentTarget.style.transform = 'translateY(-5px)' }}
    onMouseLeave={e => { if (unlocked) e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem', filter: unlocked ? 'none' : 'grayscale(100%) blur(2px)' }}>
        {unlocked ? icon : '🔒'}
      </div>
      <h4 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8, marginBottom: '1rem' }}>{desc}</p>
      
      {!unlocked && (
        <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min((progress / target) * 100, 100)}%`, height: '100%', backgroundColor: 'var(--text-color)' }} />
        </div>
      )}
    </div>
  );
}

export default Review;
