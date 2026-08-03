import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import MonthPicker from '../components/MonthPicker';

const getDateStr = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getColumnWidth = (i, activeIdx) => {
  if (i >= activeIdx && i <= activeIdx + 2) return 160; // Active window
  if (i === activeIdx - 1) return 100; // 1 step away (past)
  return 80; // Future or far past
};

function Routines() {
  const [routines, setRoutines] = useState(() => {
    const savedRoutines = localStorage.getItem('dailyPlannerRoutines');
    if (savedRoutines) return JSON.parse(savedRoutines);
    return [
      { id: 1, text: 'Morning Workout', history: {}, isLocked: false },
      { id: 2, text: 'Read 20 pages', history: {}, isLocked: false },
      { id: 3, text: 'Inbox Zero', history: {}, isLocked: false },
    ];
  });
  
  const [appStartDate] = useState(() => {
    let startDate = localStorage.getItem('dailyPlannerStartDate');
    const d = new Date();
    const firstOfMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    
    if (!startDate || startDate === getDateStr(d)) {
      startDate = firstOfMonth;
      localStorage.setItem('dailyPlannerStartDate', startDate);
    }
    return startDate;
  });
  
  const [newRoutineText, setNewRoutineText] = useState('');
  const [cheatMode, setCheatMode] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerJournals');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeJournalDate, setActiveJournalDate] = useState(null);

  useEffect(() => {
    localStorage.setItem('dailyPlannerJournals', JSON.stringify(journals));
  }, [journals]);

  const activeRoutines = routines.filter(r => !r.isArchived);
  const visibleRoutines = showArchived ? routines.filter(r => r.isArchived) : activeRoutines;

  useEffect(() => {
    localStorage.setItem('dailyPlannerRoutines', JSON.stringify(routines));
  }, [routines]);

  const [sleepHistory, setSleepHistory] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerSleep');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('dailyPlannerSleep', JSON.stringify(sleepHistory));
  }, [sleepHistory]);

  const updateSleep = (dateStr, hours) => {
    setSleepHistory(prev => {
      const newHistory = { ...prev };
      if (hours === '' || isNaN(hours)) {
        delete newHistory[dateStr];
      } else {
        newHistory[dateStr] = parseFloat(hours);
      }
      return newHistory;
    });
  };

  const toggleRoutine = (id, dateStr) => {
    setRoutines(routines.map(r => {
      if (r.id === id) {
        const newHistory = { ...r.history };
        if (newHistory[dateStr] === true) {
          newHistory[dateStr] = 'rest';
        } else if (newHistory[dateStr] === 'rest') {
          delete newHistory[dateStr];
        } else {
          newHistory[dateStr] = true;
        }
        return { ...r, history: newHistory };
      }
      return r;
    }));
  };

  const toggleArchive = (id) => {
    setRoutines(routines.map(r => r.id === id ? { ...r, isArchived: !r.isArchived } : r));
  };

  const addRoutine = (e) => {
    if (e.key === 'Enter' && newRoutineText.trim() !== '') {
      const newId = routines.length > 0 ? Math.max(...routines.map(r => r.id)) + 1 : 1;
      setRoutines([...routines, { id: newId, text: newRoutineText.trim(), history: {}, isLocked: false }]);
      setNewRoutineText('');
    }
  };

  const removeRoutine = (id) => {
    setRoutines(routines.filter(r => r.id !== id));
  };

  const toggleLock = (id) => {
    setRoutines(routines.map(r => r.id === id ? { ...r, isLocked: !r.isLocked } : r));
  };

  const allLocked = activeRoutines.length > 0 && activeRoutines.every(r => r.isLocked);
  
  const toggleAllLocks = () => {
    const newState = !allLocked;
    setRoutines(routines.map(r => ({ ...r, isLocked: newState })));
  };

  const [currentDate] = useState(new Date());
  const [viewingYear, setViewingYear] = useState(currentDate.getFullYear());
  const [viewingMonth, setViewingMonth] = useState(currentDate.getMonth());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const generateCurrentMonthDays = () => {
    const dates = [];
    const daysInMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(viewingYear, viewingMonth, i);
      const dateStr = getDateStr(d);
      const display = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      dates.push({ dateStr, display });
    }
    return dates;
  };
  
  const monthDays = generateCurrentMonthDays();
  const todayDateStr = getDateStr(new Date());
  const bufferDate = new Date();
  bufferDate.setDate(bufferDate.getDate() - 2);
  const bufferDateStr = getDateStr(bufferDate);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeIndex, setActiveIndex] = useState(() => {
    const targetIndex = monthDays.findIndex(dateObj => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round((new Date(todayDateStr) - new Date(dateObj.dateStr)) / msPerDay);
      return diffDays <= 2 && diffDays >= -2;
    });
    return targetIndex !== -1 ? targetIndex : 0;
  });

  useEffect(() => {
    const targetIndex = monthDays.findIndex(dateObj => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round((new Date(todayDateStr) - new Date(dateObj.dateStr)) / msPerDay);
      return diffDays <= 2 && diffDays >= -2;
    });
    setActiveIndex(targetIndex !== -1 ? targetIndex : 0);
  }, [viewingMonth, viewingYear]);

  const columnWidthsNumeric = monthDays.map((_, i) => getColumnWidth(i, activeIndex));
  const gridTemplateColumns = `minmax(250px, 1fr) ${columnWidthsNumeric.map(w => w + 'px').join(' ')}`;

  const scrollRef = useRef(null);
  
  useLayoutEffect(() => {
    if (scrollRef.current) {
      let scrollAmount = 0;
      for (let i = 0; i < activeIndex; i++) {
        scrollAmount += getColumnWidth(i, activeIndex) + 1;
      }
      scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'instant' });
    }
  }, [activeIndex]);

  const validDaysForStats = [];
  let curr = new Date(appStartDate);
  const end = new Date(todayDateStr);
  while (curr <= end) {
    validDaysForStats.push(getDateStr(curr));
    curr.setDate(curr.getDate() + 1);
  }

  let totalPossibleChecks = 0;
  let totalCompletedChecks = 0;
  
  validDaysForStats.forEach(dateStr => {
    activeRoutines.forEach(r => {
      if (r.history && r.history[dateStr] === true) {
        totalCompletedChecks++;
        totalPossibleChecks++;
      } else if (r.history && r.history[dateStr] === 'rest') {
        // Excluded from possible checks
      } else {
        totalPossibleChecks++;
      }
    });
  });

  const overallConsistency = totalPossibleChecks > 0 
    ? Math.round((totalCompletedChecks / totalPossibleChecks) * 100) 
    : 0;

  let currentStreak = 0;
  let bestStreak = 0;
  let perfectDaysCount = 0;
  let tempStreak = 0;

  validDaysForStats.forEach(dateStr => {
    let dayCompletedHabits = 0;
    let dayExpectedHabits = 0;
    activeRoutines.forEach(r => {
      if (r.history && r.history[dateStr] === true) dayCompletedHabits++;
      if (!r.history || r.history[dateStr] !== 'rest') dayExpectedHabits++;
    });

    if (dayExpectedHabits > 0 && dayCompletedHabits === dayExpectedHabits) {
      perfectDaysCount++;
    }

    if (dayCompletedHabits > 0) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else if (dayExpectedHabits > 0) {
      tempStreak = 0;
    }
  });

  for (let i = validDaysForStats.length - 1; i >= 0; i--) {
    const dateStr = validDaysForStats[i];
    const anyDone = activeRoutines.some(r => r.history && r.history[dateStr] === true);
    const allRest = activeRoutines.length > 0 && activeRoutines.every(r => r.history && r.history[dateStr] === 'rest');
    
    if (anyDone) {
      currentStreak++;
    } else if (allRest) {
      // Maintain streak
    } else {
      if (dateStr !== todayDateStr) break;
    }
  }

  const last14Days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last14Days.push(getDateStr(d));
  }

  const chartData = last14Days.map(dateStr => {
    let completed = 0;
    let expected = 0;
    activeRoutines.forEach(r => {
      if (r.history && r.history[dateStr] === true) completed++;
      if (!r.history || r.history[dateStr] !== 'rest') expected++;
    });
    return {
      dateStr,
      completed,
      total: expected,
      percent: expected > 0 ? Math.round((completed / expected) * 100) : (completed > 0 ? 100 : 0),
      sleep: sleepHistory[dateStr] || null,
      displayDay: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'narrow' })
    };
  });

  const maxPercent = chartData.length > 0 ? Math.max(...chartData.map(d => d.percent)) : 0;

  return (
    <main className="px-content py-section" style={{ padding: '4vw', backgroundColor: '#F0EEE9', minHeight: '100vh', color: '#1A1A1A' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span 
              className="interactive"
              onClick={() => setCheatMode(!cheatMode)}
              style={{ color: 'transparent', cursor: 'none', padding: '0.5rem', margin: '-0.5rem', userSelect: 'none' }}
              title="Hidden Unlock"
            >
              ●
            </span>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A85', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#D4F536' }}>●</span> 03 / DAILY HABITS
            </span>
          </div>
          
          {routines.length > 0 && (
            <button 
              className="interactive"
              onClick={toggleAllLocks}
              title={allLocked ? 'Unlock All' : 'Lock All'}
              style={{ 
                background: 'transparent',
                border: 'none',
                color: '#1A1A1A',
                cursor: 'none',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.6; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
            >
              {allLocked ? 'UNLOCK ALL' : 'LOCK ALL'}
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '4rem', margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>
            Tracking <span className="italic" style={{ backgroundColor: '#D4F536', color: '#1A1A1A', padding: '0.05em 0.2em 0', display: 'inline-block', lineHeight: '0.75' }}>consistency.</span>
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="interactive"
              onClick={() => setIsReordering(!isReordering)}
              style={{
                background: 'transparent', border: 'none', color: '#1A1A1A',
                fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold',
                cursor: 'none', transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.6; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
            >
              {isReordering ? 'DONE REORDERING' : 'REORDER HABITS'}
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {routines.length > 0 && (
          <div style={{ 
            marginBottom: '6rem', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '4rem' 
          }}>
            
            {/* 1. Global Stats Card */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '1.5rem', border: '1px solid #E5E5E5' }}>
              <div style={{ borderBottom: '1px solid #E5E5E5', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1A1A1A', opacity: 0.6, margin: 0 }}>Global Stats</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: 'auto' }}>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: '#D4F536' }}>
                    {overallConsistency}<span style={{ fontSize: '3.5rem', color: '#D4F536' }}>%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A85' }}>Consistency</div>
                </div>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: '#D4F536' }}>
                    {perfectDaysCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A85' }}>Perfect Days</div>
                </div>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: '#1A1A1A' }}>
                    {currentStreak}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A85' }}>Current Streak</div>
                </div>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: '#1A1A1A' }}>
                    {bestStreak}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A85' }}>Best Streak</div>
                </div>
              </div>
            </div>

            {/* 2. Interactive Charts Dashboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 2 }}>
              
              {/* Habits Bar Chart */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', border: '1px solid #E5E5E5' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1A1A1A', opacity: 0.6, margin: '0 0 1rem 0' }}>Habits Completion (Last 14 Days)</h3>
                <div style={{ width: '100%', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
                        itemStyle={{ color: '#D4F536', fontWeight: 'bold' }}
                        formatter={(value, name, props) => [`${props.payload.completed} / ${props.payload.total} habits`, 'Completed']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="percent" name="Completion %" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.percent === 100 ? '#D4F536' : (entry.percent > 0 ? '#1A1A1A' : '#E5E5E5')} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sleep Line Chart */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', border: '1px solid #E5E5E5' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1A1A1A', opacity: 0.6, margin: '0 0 1rem 0' }}>Sleep Pattern (Last 14 Days)</h3>
                <div style={{ width: '100%', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
                        itemStyle={{ color: '#64C8FF', fontWeight: 'bold' }}
                        formatter={(value) => [`${value} hrs`, 'Sleep']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sleep" 
                        name="Sleep (hrs)" 
                        stroke="#64C8FF" 
                        strokeWidth={3}
                        dot={{ fill: '#64C8FF', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#1A1A1A', stroke: '#64C8FF' }}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {isReordering ? (
          <div style={{ marginBottom: '6rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '2rem', color: 'var(--text-color)' }}>Drag to Re-prioritize Habits</h3>
            <Reorder.Group axis="y" values={routines} onReorder={setRoutines} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0 }}>
              {routines.map((routine) => (
                <Reorder.Item 
                  key={routine.id} 
                  value={routine}
                  style={{ 
                    padding: '1.5rem', backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', 
                    display: 'flex', alignItems: 'center', cursor: 'grab', fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#1A1A1A'
                  }}
                  whileDrag={{ scale: 1.02, cursor: 'grabbing', zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                >
                  <span style={{ opacity: 0.3, marginRight: '1rem', cursor: 'grab' }}>☰</span>
                  {routine.text}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-color)', margin: 0, letterSpacing: '-0.02em' }}>
                {new Date(viewingYear, viewingMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div style={{ position: 'relative' }}>
                <button 
                  className="interactive"
                  onClick={() => setIsMonthPickerOpen(true)}
                  style={{ 
                    background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '50%',
                    width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-color)', cursor: 'none', opacity: 0.6, transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = 'var(--text-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  title="Select Month"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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
            
            <div 
              ref={scrollRef}
          onScroll={(e) => {
             const scrollX = e.target.scrollLeft;
             let closestIndex = 0;
             let minDiff = Infinity;
             for (let i = 0; i < monthDays.length; i++) {
               let expectedOffset = 0;
               for (let j = 0; j < i; j++) {
                 expectedOffset += getColumnWidth(j, i) + 1;
               }
               const diff = Math.abs(scrollX - expectedOffset);
               if (diff < minDiff) {
                 minDiff = diff;
                 closestIndex = i;
               }
             }
             if (closestIndex !== activeIndex) {
               setActiveIndex(closestIndex);
             }
          }}
          style={{ 
            backgroundColor: '#E5E5E5', 
            border: '1px solid #E5E5E5', 
            display: 'grid', 
            gridTemplateColumns: gridTemplateColumns,
            gap: '1px',
            overflowX: 'auto',
            position: 'relative',
            transition: isMounted ? 'grid-template-columns 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
          }}
        >
          
          <div style={{ backgroundColor: '#F0EEE9', padding: '1rem', position: 'sticky', left: 0, zIndex: 10, borderRight: '1px solid #E5E5E5' }}></div>
          {monthDays.map((dateObj, i) => {
            const isActive = i >= activeIndex && i <= activeIndex + 2;
            const colBg = isActive ? '#FFFFFF' : 'transparent';
            const textColor = isActive ? '#1A1A1A' : '#8A8A85';
            
            const dayName = dateObj.display.split(' ')[0];
            const dateNum = dateObj.display.split(' ')[1];
            const hasJournal = !!journals[dateObj.dateStr];

            return (
              <div 
                key={i} 
                className="interactive"
                onClick={() => setActiveJournalDate(dateObj.dateStr)}
                style={{ 
                  backgroundColor: colBg, 
                  padding: '1.5rem 0', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'background-color 0.3s ease',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {hasJournal && <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#D4F536' }} />}
                <span style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem', color: textColor, textTransform: 'uppercase' }}>
                  {dayName}
                </span>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 'normal', color: textColor }}>
                  {dateNum}
                </span>
              </div>
            );
          })}
          
          <div style={{ backgroundColor: 'transparent' }}></div>

          <AnimatePresence>
            {visibleRoutines.map((routine) => (
              <motion.div 
                key={routine.id}
                className="routine-row-group"
                style={{ display: 'contents' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ 
                  backgroundColor: '#F0EEE9', 
                  padding: '1.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-serif)',
                  color: '#1A1A1A',
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 10,
                  borderRight: '1px solid #E5E5E5'
                }}>
                  {routine.text}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <button 
                      className="interactive" 
                      onClick={() => toggleLock(routine.id)}
                      style={{ background: 'transparent', border: 'none', color: routine.isLocked ? '#D4F536' : '#8A8A85', cursor: 'none', padding: 0 }}
                    >
                      {routine.isLocked ? 'UNLOCK' : 'LOCK'}
                    </button>
                    
                    {!routine.isLocked && (
                      <>
                        <button className="interactive" onClick={() => toggleArchive(routine.id)} style={{ background: 'transparent', border: 'none', color: '#8A8A85', cursor: 'none', padding: 0 }}>
                          {routine.isArchived ? 'UNARCHIVE' : 'ARCHIVE'}
                        </button>
                        <button 
                          className="interactive" 
                          onClick={() => removeRoutine(routine.id)} 
                          style={{ background: 'transparent', border: 'none', color: '#8A8A85', cursor: 'none', padding: 0, transition: 'color 0.2s ease' }} 
                          onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} 
                          onMouseLeave={(e) => e.target.style.color = '#8A8A85'}
                        >
                          REMOVE
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {monthDays.map((dateObj, i) => {
                  const isCompleted = routine.history && routine.history[dateObj.dateStr] === true;
                  const isRest = routine.history && routine.history[dateObj.dateStr] === 'rest';
                  const isFuture = dateObj.dateStr > todayDateStr;
                  const isTooOld = dateObj.dateStr < bufferDateStr;
                  const isBeforeStart = dateObj.dateStr < appStartDate;
                  
                  const isInaccessible = isFuture || (!cheatMode && isTooOld) || isBeforeStart;
                  const isActive = i >= activeIndex && i <= activeIndex + 2;
                  const colBg = isActive ? '#FFFFFF' : 'transparent';
                  
                  return (
                    <div 
                      key={i} 
                      className={`routine-cell ${!isInaccessible ? 'interactive' : ''}`}
                      onClick={() => !isInaccessible && toggleRoutine(routine.id, dateObj.dateStr)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '1rem 0',
                        cursor: isInaccessible ? 'not-allowed' : 'none',
                        backgroundColor: colBg,
                        transition: 'background-color 0.3s ease'
                      }}
                    >
                      {isCompleted && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#D4F536',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1A1A1A'
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                      {isRest && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'transparent',
                          border: '2px solid #8A8A85',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#8A8A85'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>-</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div style={{ backgroundColor: 'transparent' }}></div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div style={{ display: 'contents' }}>
            <div style={{ 
              backgroundColor: '#1A1A1A', 
              padding: '1.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontFamily: 'var(--font-serif)',
              color: '#D4F536',
              position: 'sticky', 
              left: 0, 
              zIndex: 10,
              borderRight: '1px solid #E5E5E5'
            }}>
              Sleep (hrs)
            </div>
            
            {monthDays.map((dateObj, i) => {
              const isFuture = dateObj.dateStr > todayDateStr;
              const isTooOld = dateObj.dateStr < bufferDateStr;
              const isBeforeStart = dateObj.dateStr < appStartDate;
              const isInaccessible = isFuture || (!cheatMode && isTooOld) || isBeforeStart;
              
              const isActive = i >= activeIndex && i <= activeIndex + 2;
              const colBg = isActive ? '#FFFFFF' : 'transparent';
              
              return (
                <div 
                  key={`sleep-${i}`} 
                  className={`routine-cell`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '1rem 0',
                    backgroundColor: colBg,
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    disabled={isInaccessible}
                    value={sleepHistory[dateObj.dateStr] || ''}
                    onChange={(e) => updateSleep(dateObj.dateStr, e.target.value)}
                    className="interactive"
                    style={{
                      width: '60px',
                      padding: '0.5rem',
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      color: '#1A1A1A',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: isInaccessible ? 'not-allowed' : 'text',
                      opacity: isInaccessible ? 0.3 : 1,
                      outline: 'none'
                    }}
                    placeholder="-"
                  />
                </div>
              );
            })}
            
            <div style={{ backgroundColor: 'transparent' }}></div>
          </div>

          <div style={{ display: 'contents' }}>
            <div style={{ 
              backgroundColor: '#F0EEE9', 
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              position: 'sticky', 
              left: 0, 
              zIndex: 10,
              borderRight: '1px solid #E5E5E5'
            }}>
              <input 
                type="text" 
                className="routine-input interactive"
                placeholder="+ Add new habit..." 
                value={newRoutineText}
                onChange={(e) => setNewRoutineText(e.target.value)}
                onKeyDown={addRoutine}
                style={{ color: '#8A8A85', fontStyle: 'italic', backgroundColor: 'transparent', width: '100%', border: 'none', outline: 'none' }}
              />
            </div>
            {monthDays.map((_, i) => {
              const isActive = i >= activeIndex && i <= activeIndex + 2;
              const colBg = isActive ? '#FFFFFF' : 'transparent';
              return (
                <div key={`empty-${i}`} className="routine-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colBg, transition: 'background-color 0.3s ease' }}>
                </div>
              );
            })}
            
            
            <div style={{ backgroundColor: 'transparent' }}></div>
          </div>
        </div>
        </div>
        )}

        <div style={{ marginTop: '8rem', textAlign: 'center', opacity: 0.5, display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </motion.div>

      {/* Journal Modal */}
      <AnimatePresence>
        {activeJournalDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveJournalDate(null)}
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
                width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-color)',
                borderLeft: '1px solid var(--border-color)', padding: '3rem',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{new Date(activeJournalDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
              <textarea
                autoFocus
                placeholder="Write your reflection for the day..."
                value={journals[activeJournalDate] || ''}
                onChange={e => setJournals({...journals, [activeJournalDate]: e.target.value})}
                style={{
                  flex: 1, backgroundColor: 'transparent', border: 'none', resize: 'none',
                  outline: 'none', color: 'var(--text-color)', fontSize: '1.1rem',
                  fontFamily: 'var(--font-serif)', lineHeight: '1.6'
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default Routines;
