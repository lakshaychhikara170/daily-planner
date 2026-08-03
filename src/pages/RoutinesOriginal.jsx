import React, { useState, useEffect, useRef, useLayoutEffect, useContext } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import MonthPicker from '../components/MonthPicker';
import EditableWidget from '../components/EditableWidget';
import EditableText from '../components/EditableText';
import { AppContext } from '../context/AppContext';

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
  const { addPoints, updateQuest } = useContext(AppContext);
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
  const [newMetricText, setNewMetricText] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('hrs');
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

  const [metrics, setMetrics] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerMetricsDefs');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'sleep', label: 'Sleep', unit: 'hrs', step: 0.5, max: 24 },
      { id: 'water', label: 'Water', unit: 'L', step: 0.5, max: 10 },
      { id: 'deepwork', label: 'Deep Work', unit: 'hrs', step: 0.5, max: 16 }
    ];
  });

  const [metricsHistory, setMetricsHistory] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerMetricsHistory');
    if (saved) return JSON.parse(saved);
    
    // Auto-migrate old sleep history
    const oldSleep = localStorage.getItem('dailyPlannerSleep');
    if (oldSleep) {
      const parsed = JSON.parse(oldSleep);
      const newHistory = {};
      Object.keys(parsed).forEach(date => {
        newHistory[date] = { sleep: parsed[date] };
      });
      return newHistory;
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('dailyPlannerMetricsDefs', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('dailyPlannerMetricsHistory', JSON.stringify(metricsHistory));
  }, [metricsHistory]);

  const updateMetric = (dateStr, metricId, value) => {
    setMetricsHistory(prev => {
      const newHistory = { ...prev };
      const currentDay = { ...(prev[dateStr] || {}) };
      
      if (value === '' || isNaN(value)) {
        delete currentDay[metricId];
        if (Object.keys(currentDay).length === 0) {
          delete newHistory[dateStr];
        } else {
          newHistory[dateStr] = currentDay;
        }
      } else {
        currentDay[metricId] = parseFloat(value);
        newHistory[dateStr] = currentDay;
      }
      return newHistory;
    });
  };

  const [activeChartMetric, setActiveChartMetric] = useState('sleep');
  const activeMetricObj = metrics.find(m => m.id === activeChartMetric) || metrics[0];

  const toggleDay = (routineId, dayIndex) => {
    setRoutines(routines.map((r, rIndex) => {
      if (r.id === routineId) {
        const newHistory = { ...r.history };
        const dateStr = monthDays[dayIndex].dateStr;
        
        if (newHistory[dateStr] === true) {
          newHistory[dateStr] = 'rest';
          if (dateStr === todayDateStr) {
             addPoints(-100); 
          }
        } else if (newHistory[dateStr] === 'rest') {
          delete newHistory[dateStr];
        } else {
          newHistory[dateStr] = true;
          if (dateStr === todayDateStr) {
             const basePoints = Math.max(10, 100 - (rIndex * 20));
             let streakMultiplier = 1;
             for (let i = dayIndex - 1; i >= 0; i--) {
                const checkDate = monthDays[i].dateStr;
                if (newHistory[checkDate] === true || newHistory[checkDate] === 'rest') {
                   streakMultiplier++;
                } else {
                   break;
                }
             }
             addPoints(basePoints * streakMultiplier);
             if (updateQuest) updateQuest('routine', 1);
          }
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

  const addMetric = (e) => {
    e.preventDefault();
    if (newMetricText.trim() !== '') {
      const label = newMetricText.trim();
      const unit = newMetricUnit;
      const newId = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (!metrics.some(m => m.id === newId)) {
        setMetrics([...metrics, { id: newId, label, unit, step: 1, max: 1000 }]);
      }
      setNewMetricText('');
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
  const gridTemplateColumns = `minmax(250px, 1fr) ${columnWidthsNumeric.map(w => w + 'px').join(' ')} 50vw`;

  const scrollRef = useRef(null);
  const chartScrollRef1 = useRef(null);
  const chartScrollRef2 = useRef(null);
  
  useLayoutEffect(() => {
    if (scrollRef.current) {
      let scrollAmount = 0;
      for (let i = 0; i < activeIndex; i++) {
        scrollAmount += getColumnWidth(i, activeIndex) + 1;
      }
      scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'instant' });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (chartScrollRef1.current && chartScrollRef2.current) {
      // 60 days in past * 45px per day = 2700px. Center it based on container width.
      const targetScroll = (60 * 45) - (chartScrollRef1.current.clientWidth / 2) + 20;
      chartScrollRef1.current.scrollTo({ left: targetScroll, behavior: 'instant' });
      chartScrollRef2.current.scrollTo({ left: targetScroll, behavior: 'instant' });
    }
  }, []);

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

  // --- NEW STATS CALCULATIONS ---
  let totalCompletions = totalCompletedChecks;
  let avgDailyHabits = validDaysForStats.length > 0 ? (totalCompletions / validDaysForStats.length).toFixed(1) : 0;

  let topHabitName = "-";
  let topHabitCount = -1;
  activeRoutines.forEach(r => {
    let count = 0;
    validDaysForStats.forEach(dateStr => {
      if (r.history && r.history[dateStr] === true) count++;
    });
    if (count > topHabitCount) {
      topHabitCount = count;
      topHabitName = r.text;
    }
  });
  if (topHabitName.length > 15) {
    topHabitName = topHabitName.substring(0, 15) + '...';
  }

  let last7DaysCompletions = 0;
  let prev7DaysCompletions = 0;
  
  const sortedValidDays = [...validDaysForStats].sort((a,b) => b.localeCompare(a)); // newest first
  for (let i = 0; i < sortedValidDays.length; i++) {
    const dateStr = sortedValidDays[i];
    let dayCompletions = 0;
    activeRoutines.forEach(r => {
      if (r.history && r.history[dateStr] === true) dayCompletions++;
    });
    
    if (i < 7) {
      last7DaysCompletions += dayCompletions;
    } else if (i < 14) {
      prev7DaysCompletions += dayCompletions;
    }
  }

  let weeklyTrendValue = last7DaysCompletions - prev7DaysCompletions;
  let weeklyTrendSymbol = weeklyTrendValue > 0 ? '+' : (weeklyTrendValue < 0 ? '' : '');
  let weeklyTrendDisplay = `${weeklyTrendSymbol}${weeklyTrendValue}`;

  const scrollableDays = [];
  for (let i = -60; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    scrollableDays.push({
      dateStr: getDateStr(d),
      display: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }

  const chartData = scrollableDays.map(dateObj => {
    const dateStr = dateObj.dateStr;
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
      metrics: metricsHistory[dateStr] || {},
      displayDay: dateObj.display
    };
  });

  const HabitTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', padding: '0.5rem 1rem', fontWeight: 'bold', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', textAlign: 'center', boxShadow: '4px 4px 0px var(--accent-green)' }}>
          <div>{payload[0].payload.percent}%</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, fontFamily: 'var(--font-sans)', fontWeight: 'normal', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {payload[0].payload.completed} / {payload[0].payload.total} done
          </div>
        </div>
      );
    }
    return null;
  };

  const MetricTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', padding: '0.5rem 1rem', fontWeight: 'bold', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', textAlign: 'center', boxShadow: '4px 4px 0px var(--accent-green)' }}>
          {payload[0].value} <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-sans)', fontWeight: 'normal', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeMetricObj.unit}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="px-content py-section" style={{ padding: '4vw' }}>
      <style>{`
        .scroll-chart-container::-webkit-scrollbar {
          height: 6px;
        }
        .scroll-chart-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-chart-container::-webkit-scrollbar-thumb {
          background-color: var(--border-color);
          border-radius: 4px;
        }
      `}</style>
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
              style={{ color: 'var(--accent-green)', cursor: 'none', padding: '0.5rem', margin: '-0.5rem' }}
              title="Hidden Unlock"
            >
              ●
            </span>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>03 / Daily Habits</span>
          </div>
          
          {routines.length > 0 && (
            <button 
              className="interactive"
              onClick={toggleAllLocks}
              title={allLocked ? 'Unlock All' : 'Lock All'}
              style={{ 
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: 'var(--text-color)',
                cursor: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = 'var(--text-color)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {allLocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
              )}
            </button>
          )}
        </div>
        
        <EditableWidget id="routines-main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '4rem', margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>
            <EditableText id="routines-h2-1" defaultText="Tracking " />
            <EditableText id="routines-h2-2" defaultText="consistency." as="span" className="italic" defaultStyles={{ fontSize: '1.2em', backgroundColor: 'var(--accent-green)', color: '#000', padding: '0.05em 0.2em 0', display: 'inline-block', lineHeight: '0.75' }} />
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="interactive"
              onClick={() => setIsReordering(!isReordering)}
              title={isReordering ? 'Done Reordering' : 'Reorder Habits'}
              style={{
                background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '50%',
                width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-color)', cursor: 'none', opacity: 0.6, transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = 'var(--text-color)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {isReordering ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              )}
            </button>
          </div>
        </EditableWidget>

        {/* Analytics Dashboard */}
        {routines.length > 0 && (
          <div style={{ 
            marginBottom: '6rem', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '4rem' 
          }}>
            
            {/* 1. Global Stats Card */}
            <EditableWidget id="routines-global-stats" style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--card-bg)', padding: '3rem', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-color)', opacity: 0.6, margin: 0 }}>Global Stats</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: 'auto' }}>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: 'var(--accent-green)' }}>
                    {overallConsistency}<span style={{ fontSize: '2rem', color: 'var(--dim-text)', marginLeft: '0.25rem' }}>%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>Consistency</div>
                </div>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: 'var(--accent-green)' }}>
                    {perfectDaysCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>Perfect Days</div>
                </div>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                    {currentStreak}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>Current Streak</div>
                </div>
                <div>
                  <div style={{ fontSize: '3.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                    {bestStreak}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>Best Streak</div>
                </div>
                {/* --- NEW STATS --- */}
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                    {totalCompletions}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>Total Completions</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                    {avgDailyHabits}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>Avg Daily Habits</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                    {topHabitName}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>Top Habit</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '400', fontFamily: 'var(--font-serif)', lineHeight: '1', marginBottom: '0.5rem', color: weeklyTrendValue > 0 ? 'var(--accent-green)' : 'var(--text-color)' }}>
                    {weeklyTrendDisplay}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)' }}>7-Day Trend</div>
                </div>
              </div>
            </EditableWidget>

            {/* 2. Interactive Charts Dashboard */}
            <EditableWidget id="routines-interactive-charts" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 2 }}>
              
              {/* Habits Line Chart */}
              <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-color)', opacity: 0.6, margin: '0 0 1.5rem 0' }}>Habits Completion (Scrollable Timeline)</h3>
                <div 
                  ref={chartScrollRef1}
                  className="scroll-chart-container"
                  style={{ width: '100%', height: '180px', overflowX: 'auto', overflowY: 'hidden' }}
                >
                  <div style={{ width: `${scrollableDays.length * 45}px`, height: '160px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                        <XAxis 
                          dataKey="displayDay" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'var(--dim-text)', fontSize: 10, fontFamily: 'var(--font-sans)' }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'var(--dim-text)', fontSize: 10, fontFamily: 'var(--font-sans)' }} 
                          domain={[0, 100]}
                          ticks={[0, 50, 100]}
                          tickFormatter={(val) => `${val}%`}
                          width={35}
                        />
                        <Tooltip 
                          content={<HabitTooltip />}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar dataKey="percent" name="Completion %" radius={[4, 4, 0, 0]} maxBarSize={30}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.percent === 100 ? 'var(--accent-green)' : (entry.percent > 0 ? 'var(--text-color)' : 'var(--border-color)')} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Metrics Line Chart */}
              <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-color)', opacity: 0.6, margin: 0 }}>Metrics (Scrollable)</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {metrics.map(m => (
                      <button
                        key={m.id}
                        className="interactive"
                        onClick={() => setActiveChartMetric(m.id)}
                        style={{
                          background: activeChartMetric === m.id ? 'var(--text-color)' : 'transparent',
                          color: activeChartMetric === m.id ? 'var(--bg-color)' : 'var(--text-color)',
                          border: `1px solid ${activeChartMetric === m.id ? 'var(--text-color)' : 'var(--border-color)'}`,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '16px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-sans)',
                          cursor: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div 
                  ref={chartScrollRef2}
                  className="scroll-chart-container"
                  style={{ width: '100%', height: '180px', overflowX: 'auto', overflowY: 'hidden' }}
                >
                  <div style={{ width: `${scrollableDays.length * 45}px`, height: '160px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                      <XAxis 
                        dataKey="displayDay" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--dim-text)', fontSize: 10, fontFamily: 'var(--font-sans)' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--dim-text)', fontSize: 10, fontFamily: 'var(--font-sans)' }} 
                        domain={[0, 'auto']}
                        tickFormatter={(val) => `${val}${activeMetricObj ? activeMetricObj.unit : ''}`}
                        width={35}
                      />
                      <Tooltip 
                        content={<MetricTooltip />}
                        cursor={false}
                      />
                      <Line 
                        key={activeChartMetric} // forces re-animation on swap
                        type="monotone" 
                        dataKey={`metrics.${activeChartMetric}`} 
                        name={activeMetricObj.label} 
                        stroke="var(--text-color)" 
                        strokeWidth={3}
                        dot={{ fill: 'var(--bg-color)', stroke: 'var(--text-color)', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8, fill: 'var(--accent-green)', stroke: 'var(--text-color)', strokeWidth: 2 }}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            </EditableWidget>
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
                    padding: '1.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', 
                    display: 'flex', alignItems: 'center', cursor: 'grab', fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-color)'
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
          
          <div style={{ backgroundColor: 'var(--header-bg)', padding: '1rem', position: 'sticky', left: 0, zIndex: 10, borderRight: '1px solid var(--border-color)' }}></div>
          {monthDays.map((dateObj, i) => {
            const isActive = i >= activeIndex && i <= activeIndex + 2;
            const colBg = isActive ? 'var(--card-bg)' : 'var(--cell-bg)';
            const textColor = isActive ? 'var(--text-color)' : 'var(--dim-text)';
            
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
                {hasJournal && <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-green)' }} />}
                <span style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem', color: textColor }}>
                  {dayName}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textColor }}>
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
                  backgroundColor: 'var(--header-bg)', 
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-color)',
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 10,
                  borderRight: '1px solid var(--border-color)'
                }}>
                  {routine.text}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button 
                      className="interactive" 
                      onClick={() => toggleLock(routine.id)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--accent-green)', 
                        opacity: routine.isLocked ? 1 : 0.4,
                        cursor: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title={routine.isLocked ? "Unlock Habit" : "Lock Habit to prevent deletion"}
                    >
                      {routine.isLocked ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                      )}
                    </button>
                    
                    {!routine.isLocked && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="delete-btn interactive" onClick={() => toggleArchive(routine.id)} style={{ color: 'var(--text-color)', opacity: 0.4 }} title={routine.isArchived ? "Unarchive" : "Archive"}>
                          {routine.isArchived ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="12" y1="17" x2="12" y2="10"></line><polyline points="9 13 12 10 15 13"></polyline></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                          )}
                        </button>
                        <button className="delete-btn interactive" onClick={() => removeRoutine(routine.id)} style={{ color: 'var(--accent-orange)', opacity: 0.4 }} title="Delete">×</button>
                      </div>
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
                  const colBg = isActive ? 'var(--card-bg)' : 'var(--cell-bg)';
                  
                  return (
                    <div 
                      key={i} 
                      className={`routine-cell ${!isInaccessible ? 'interactive' : ''}`}
                      onClick={() => !isInaccessible && toggleDay(routine.id, i)}
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
                          backgroundColor: 'var(--accent-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000000'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>✓</span>
                        </div>
                      )}
                      {isRest && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'transparent',
                          border: '2px dashed var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--dim-text)'
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
              backgroundColor: 'var(--header-bg)', 
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              position: 'sticky', 
              left: 0, 
              zIndex: 10,
              borderRight: '1px solid var(--border-color)'
            }}>
              <input 
                type="text" 
                className="routine-input interactive"
                placeholder="+ Add new habit and press Enter" 
                value={newRoutineText}
                onChange={(e) => setNewRoutineText(e.target.value)}
                onKeyDown={addRoutine}
                style={{ color: 'var(--text-color)', backgroundColor: 'transparent', border: 'none', outline: 'none', width: '100%' }}
              />
            </div>
            {monthDays.map((_, i) => {
              const isActive = i >= activeIndex && i <= activeIndex + 2;
              const colBg = isActive ? 'var(--card-bg)' : 'var(--cell-bg)';
              return (
                <div key={`empty-habit-${i}`} className="routine-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colBg, transition: 'background-color 0.3s ease' }}></div>
              );
            })}
            <div style={{ backgroundColor: 'transparent' }}></div>
          </div>

          {/* Visual Separator for Metrics */}
          <div style={{ display: 'contents' }}>
            <div style={{ gridColumn: '1 / -1', height: '4rem', backgroundColor: 'var(--bg-color)' }} />
          </div>

          {metrics.map(metric => (
            <div key={`metric-row-${metric.id}`} style={{ display: 'contents' }}>
              <div style={{ 
                backgroundColor: 'var(--header-bg)', 
                padding: '1.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '1.25rem',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-color)',
                fontStyle: 'italic',
                position: 'sticky', 
                left: 0, 
                zIndex: 10,
                borderRight: '1px solid var(--border-color)'
              }}>
                <span>{metric.label} {metric.unit && <span style={{ fontSize: '0.75rem', opacity: 0.5, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'normal' }}>({metric.unit})</span>}</span>
                <button className="delete-btn interactive" onClick={() => setMetrics(metrics.filter(m => m.id !== metric.id))} style={{ color: 'var(--accent-orange)', opacity: 0.4, border: 'none', background: 'transparent', cursor: 'none' }} title="Delete Metric">×</button>
              </div>
              
              {monthDays.map((dateObj, i) => {
                const isFuture = dateObj.dateStr > todayDateStr;
                const isTooOld = dateObj.dateStr < bufferDateStr;
                const isBeforeStart = dateObj.dateStr < appStartDate;
                const isInaccessible = isFuture || (!cheatMode && isTooOld) || isBeforeStart;
                
                const isActive = i >= activeIndex && i <= activeIndex + 2;
                const colBg = isActive ? 'var(--card-bg)' : 'var(--cell-bg)';
                
                const dailyMetrics = metricsHistory[dateObj.dateStr] || {};
                const hasValue = dailyMetrics[metric.id] !== undefined;
                
                return (
                  <div 
                    key={`${metric.id}-${i}`} 
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
                      step={metric.step}
                      min="0"
                      max={metric.max}
                      disabled={isInaccessible}
                      value={hasValue ? dailyMetrics[metric.id] : ''}
                      onChange={(e) => updateMetric(dateObj.dateStr, metric.id, e.target.value)}
                      className="interactive"
                      style={{
                        width: '60px',
                        padding: '0.5rem',
                        textAlign: 'center',
                        backgroundColor: hasValue ? 'var(--text-color)' : 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0px',
                        color: hasValue ? 'var(--bg-color)' : 'var(--text-color)',
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.1rem',
                        fontWeight: hasValue ? 'bold' : 'normal',
                        cursor: isInaccessible ? 'not-allowed' : 'text',
                        opacity: isInaccessible ? 0.3 : 1,
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      placeholder="-"
                    />
                  </div>
                );
              })}
              <div style={{ backgroundColor: 'transparent' }}></div>
            </div>
          ))}

          <div style={{ display: 'contents' }}>
            <form style={{ 
              backgroundColor: 'var(--header-bg)', 
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              position: 'sticky', 
              left: 0, 
              zIndex: 10,
              borderRight: '1px solid var(--border-color)',
              gap: '0.5rem'
            }} onSubmit={addMetric}>
              <input 
                type="text" 
                className="routine-input interactive"
                placeholder="+ Add new metric (e.g. Reading)" 
                value={newMetricText}
                onChange={(e) => setNewMetricText(e.target.value)}
                style={{ color: 'var(--text-color)', backgroundColor: 'transparent', border: 'none', outline: 'none', width: '100%', fontStyle: 'italic', flex: 1 }}
              />
              {newMetricText.trim() !== '' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select 
                    value={newMetricUnit} 
                    onChange={(e) => setNewMetricUnit(e.target.value)}
                    className="interactive"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text-color)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="hrs">hrs</option>
                    <option value="mins">mins</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pages">pages</option>
                    <option value="km">km</option>
                    <option value="miles">miles</option>
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                    <option value="count">count</option>
                    <option value="%">%</option>
                    <option value="$">$</option>
                  </select>
                  <button type="submit" className="interactive" style={{ 
                    backgroundColor: 'var(--text-color)', 
                    color: 'var(--bg-color)', 
                    border: 'none', 
                    borderRadius: '4px',
                    padding: '0.25rem 0.75rem',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    cursor: 'none',
                    fontWeight: 'bold'
                  }}>Add</button>
                </div>
              )}
            </form>
            {monthDays.map((_, i) => {
              const isActive = i >= activeIndex && i <= activeIndex + 2;
              const colBg = isActive ? 'var(--card-bg)' : 'var(--cell-bg)';
              return (
                <div key={`empty-metric-${i}`} className="routine-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colBg, transition: 'background-color 0.3s ease' }}>
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
