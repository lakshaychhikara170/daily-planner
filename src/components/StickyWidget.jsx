import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { getMediaBlob } from '../utils/storage';

export default function StickyWidget({ standaloneMode = false }) {
  const { tasks, setTasks, addPoints } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(standaloneMode ? true : false);
  const [activeTab, setActiveTabState] = useState(() => localStorage.getItem('sticky_widget_tab') || 'goals');
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('sticky_widget_tab', tab);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [widgetWidth, setWidgetWidth] = useState(320);
  const [widgetHeight, setWidgetHeight] = useState(300);
  
  const [newTaskText, setNewTaskText] = useState('');
  const [newScheduleTask, setNewScheduleTask] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [focusTick, setFocusTick] = useState(0);
  const [timerStyle, setTimerStyle] = useState(() => localStorage.getItem('widget_timer_style') || 'cinematic');
  const toggleTimerStyle = (e) => {
    e.stopPropagation();
    const next = timerStyle === 'compact' ? 'cinematic' : 'compact';
    setTimerStyle(next);
    localStorage.setItem('widget_timer_style', next);
  };
  
  useEffect(() => {
    const handler = () => setFocusTick(t => t + 1);
    window.addEventListener('mainFocusUpdated', handler);
    return () => window.removeEventListener('mainFocusUpdated', handler);
  }, []);
  
  // Data for Schedule, Routines, and Goals
  const [scheduleData, setScheduleData] = useState([]);
  const [routineData, setRoutineData] = useState([]);
  const [goalsData, setGoalsData] = useState([]);

  // Start positioned offscreen to avoid flashing before calculating screen bounds
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isMounted, setIsMounted] = useState(false);

  const pendingTasks = tasks.filter(t => !t.completed);

  // Re-calculate default position on mount
  useEffect(() => {
    const saved = localStorage.getItem('execute_pro_sticky_pos');
    let initialPos = null;
    if (saved) {
      try { initialPos = JSON.parse(saved); } catch (e) { }
    }
    
    if (!initialPos || initialPos.x > window.innerWidth || initialPos.y > window.innerHeight) {
      initialPos = { 
        x: window.innerWidth > 340 ? window.innerWidth - 300 : 20, 
        y: window.innerHeight - 100 
      };
    }
    setPosition(initialPos);
    setIsMounted(true);
  }, []);

  // Fetch data when opened or tab changed, and listen for updates
  useEffect(() => {
    const fetchSchedule = () => {
      const sched = localStorage.getItem('dailyPlannerScheduleV2');
      if (sched) setScheduleData(JSON.parse(sched));
    };

    const fetchRoutines = () => {
      const rout = localStorage.getItem('dailyPlannerRoutines');
      if (rout) setRoutineData(JSON.parse(rout));
    };

    const fetchGoals = () => {
      const goals = localStorage.getItem('dailyPlannerGoals');
      if (goals) setGoalsData(JSON.parse(goals));
    };

    if (isOpen) {
      if (activeTab === 'schedule') fetchSchedule();
      if (activeTab === 'routines') fetchRoutines();
      if (activeTab === 'goals' || activeTab === 'dashboard') fetchGoals();
    }

    // Listen for cross-component instantaneous updates
    window.addEventListener('scheduleUpdated', fetchSchedule);
    window.addEventListener('routinesUpdated', fetchRoutines);
    window.addEventListener('goalsUpdated', fetchGoals);

    return () => {
      window.removeEventListener('scheduleUpdated', fetchSchedule);
      window.removeEventListener('routinesUpdated', fetchRoutines);
      window.removeEventListener('goalsUpdated', fetchGoals);
    };
  }, [isOpen, activeTab]);

  // Keep date updated for midnight rollover
  const [todayStr, setTodayStr] = useState(new Date().toISOString().split('T')[0]);
  useEffect(() => {
    const timer = setInterval(() => {
      const newToday = new Date().toISOString().split('T')[0];
      if (newToday !== todayStr) setTodayStr(newToday);
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [todayStr]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event, info) => {
    setTimeout(() => setIsDragging(false), 100);
    const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
    const boundedX = Math.max(0, Math.min(newPos.x, window.innerWidth - 60));
    const boundedY = Math.max(0, Math.min(newPos.y, window.innerHeight - 60));
    setPosition({ x: boundedX, y: boundedY });
    localStorage.setItem('execute_pro_sticky_pos', JSON.stringify({ x: boundedX, y: boundedY }));
  };

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = widgetWidth;
    const startHeight = widgetHeight;

    const doDrag = (dragEvent) => {
      const newW = Math.max(260, Math.min(800, startWidth + (dragEvent.clientX - startX)));
      const newH = Math.max(200, Math.min(800, startHeight + (dragEvent.clientY - startY)));
      if (standaloneMode && window.electronAPI) {
         window.electronAPI.resizeWidget(newW, newH + 60); // include header
      } else {
         setWidgetWidth(newW);
         setWidgetHeight(newH);
      }
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  const toggleOpen = () => {
    if (isDragging) return;
    
    if (standaloneMode && window.electronAPI) {
      window.electronAPI.closeWidget();
      return;
    }
    
    if (!isOpen) {
      let newX = position.x;
      let newY = position.y;
      
      const currentWidth = widgetWidth;
      const currentHeight = widgetHeight + 60; // approx header height
      
      if (newX + currentWidth > window.innerWidth) {
        newX = Math.max(0, window.innerWidth - currentWidth - 20);
      }
      
      if (newY + currentHeight > window.innerHeight) {
        newY = Math.max(0, window.innerHeight - currentHeight - 20);
      }
      
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
        localStorage.setItem('execute_pro_sticky_pos', JSON.stringify({ x: newX, y: newY }));
      }
    }
    
    setIsOpen(!isOpen);
  };
  const toggleTask = (id) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isCompleted = !task.completed;
        if (addPoints) {
           if (isCompleted) addPoints(100);
           else addPoints(-100);
        }
        return { ...task, completed: isCompleted };
      }
      return task;
    }));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const toggleRoutine = (id) => {
    const updated = routineData.map(r => {
      if (r.id === id) {
         const newHistory = { ...(r.history || {}) };
         if (newHistory[todayStr]) {
            delete newHistory[todayStr];
         } else {
            newHistory[todayStr] = true;
         }
         return { ...r, history: newHistory };
      }
      return r;
    });
    setRoutineData(updated);
    localStorage.setItem('dailyPlannerRoutines', JSON.stringify(updated));
    // Dispatch custom event so the main Routines page can update instantly
    window.dispatchEvent(new CustomEvent('routinesUpdated', { detail: { source: 'StickyWidget' } }));
  };

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && newTaskText.trim()) {
      const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
      setTasks([{ id: newId, text: newTaskText.trim(), completed: false, createdAt: new Date().toISOString() }, ...tasks]);
      setNewTaskText('');
    }
  };

  const handleAddSchedule = (e) => {
    if (e.key === 'Enter' && newScheduleTask.trim()) {
      const newId = scheduleData.length > 0 ? Math.max(...scheduleData.map(b => b.id)) + 1 : 1;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newBlock = { id: newId, time: timeStr, duration: 60, task: newScheduleTask.trim(), energy: 'med' };
      const updated = [...scheduleData, newBlock];
      setScheduleData(updated);
      localStorage.setItem('dailyPlannerScheduleV2', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('scheduleUpdated', { detail: { source: 'StickyWidget' } }));
      setNewScheduleTask('');
    }
  };

  const deleteScheduleBlock = (id) => {
    const updated = scheduleData.filter(b => b.id !== id);
    setScheduleData(updated);
    localStorage.setItem('dailyPlannerScheduleV2', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('scheduleUpdated', { detail: { source: 'StickyWidget' } }));
  };

  const toggleGoal = (id) => {
    const updated = goalsData.map(g => {
      if (g.id === id) {
        if (!g.isCompleted && addPoints) addPoints(500); // 500 XP for completing a goal!
        return { ...g, isCompleted: !g.isCompleted };
      }
      return g;
    });
    setGoalsData(updated);
    localStorage.setItem('dailyPlannerGoals', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: { source: 'StickyWidget' } }));
  };

  const deleteGoal = (id) => {
    const updated = goalsData.filter(g => g.id !== id);
    setGoalsData(updated);
    localStorage.setItem('dailyPlannerGoals', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: { source: 'StickyWidget' } }));
  };

  const handleAddGoal = (e) => {
    if (e.key === 'Enter' && newGoalTitle.trim() && newGoalTargetDate) {
      const newId = goalsData.length > 0 ? Math.max(...goalsData.map(g => g.id)) + 1 : 1;
      const startStr = new Date().toISOString().split('T')[0];
      const start = new Date(startStr);
      const end = new Date(newGoalTargetDate);
      const diffTime = end - start;
      const targetDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      const newGoal = {
        id: newId,
        title: newGoalTitle.trim(),
        targetDays: targetDays,
        targetDate: newGoalTargetDate,
        startDate: startStr,
        isCompleted: false
      };
      const updated = [...goalsData, newGoal];
      setGoalsData(updated);
      localStorage.setItem('dailyPlannerGoals', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: { source: 'StickyWidget' } }));
      setNewGoalTitle('');
      setNewGoalTargetDate('');
    }
  };

  const getDaysPassed = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!isMounted) return null;

  return (
    <motion.div
      drag={!standaloneMode}
      dragMomentum={false}
      onDragStart={!standaloneMode ? handleDragStart : undefined}
      onDragEnd={!standaloneMode ? handleDragEnd : undefined}
      animate={!standaloneMode ? position : undefined}
      initial={!standaloneMode ? position : undefined}
      style={{
        position: standaloneMode ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        width: standaloneMode ? '100vw' : (isOpen ? `${widgetWidth}px` : 'auto'),
        height: standaloneMode ? '100vh' : 'auto',
        touchAction: 'none'
      }}
    >
      <div style={{
        backgroundColor: 'var(--accent-green)',
        color: '#0A0A0A',
        border: standaloneMode ? 'none' : '2px solid #0A0A0A',
        boxShadow: standaloneMode ? 'none' : '6px 6px 0px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'border-radius 0s',
        borderRadius: standaloneMode ? '16px' : (isOpen ? '16px' : '9999px'),
        cursor: standaloneMode ? 'default' : (isOpen ? 'default' : 'grab'),
        position: 'relative',
        height: '100%',
        width: '100%'
      }}>
        
        {/* Header / Toggle Button */}
        <div 
          onClick={!standaloneMode ? toggleOpen : undefined}
          style={{
            padding: isOpen ? '0.75rem 1rem' : '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isOpen ? '2px solid #0A0A0A' : 'none',
            cursor: standaloneMode ? 'move' : (isDragging ? 'grabbing' : 'pointer'),
            WebkitAppRegion: standaloneMode ? 'drag' : 'none',
            backgroundColor: 'var(--accent-green)',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            {isOpen ? 'Execute Pro Mini' : `${pendingTasks.length} Pending`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', WebkitAppRegion: 'no-drag' }}>
            {isOpen && (
              <svg onClick={toggleOpen} style={{ cursor: 'pointer' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={standaloneMode ? "M6 18L18 6M6 6l12 12" : "M19 9l-7 7-7-7"}></path></svg>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: standaloneMode ? 'auto' : 0, opacity: standaloneMode ? 1 : 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0 }}
              style={{ backgroundColor: (activeTab === 'dashboard' || activeTab === 'goals') ? '#e2e2da' : '#f6f6f1', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              {/* Tab Selector */}
              <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  style={{ flex: 1, padding: '0.5rem', background: activeTab === 'dashboard' || activeTab === 'goals' ? '#e2e2da' : 'transparent', border: 'none', borderRight: '1px solid #ccc', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', WebkitAppRegion: 'no-drag' }}>
                  Dashboard
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveTab('tasks'); }}
                  style={{ flex: 1, padding: '0.5rem', background: activeTab === 'tasks' ? '#e2e2da' : 'transparent', border: 'none', borderRight: '1px solid #ccc', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', WebkitAppRegion: 'no-drag' }}>
                  Tasks
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveTab('schedule'); }}
                  style={{ flex: 1, padding: '0.5rem', background: activeTab === 'schedule' ? '#e2e2da' : 'transparent', border: 'none', borderRight: '1px solid #ccc', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', WebkitAppRegion: 'no-drag' }}>
                  Schedule
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveTab('routines'); }}
                  style={{ flex: 1, padding: '0.5rem', background: activeTab === 'routines' ? '#e2e2da' : 'transparent', border: 'none', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', WebkitAppRegion: 'no-drag' }}>
                  Routines
                </button>
              </div>

              {/* Tab Content */}
              <div style={{ padding: (activeTab === 'dashboard' || activeTab === 'goals') ? '0.5rem' : '1rem', flex: 1, overflowY: 'auto' }}>
                
                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {tasks.filter(t => !t.completed).length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>All caught up.</p>
                      ) : (
                        tasks.filter(t => !t.completed).map(task => (
                          <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem', borderBottom: '1px solid #ddd', position: 'relative' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                              style={{ width: '18px', height: '18px', flexShrink: 0, borderRadius: '50%', border: '2px solid #0A0A0A', backgroundColor: 'transparent', cursor: 'pointer', padding: 0, marginTop: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            ></button>
                            <span style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600, flex: 1 }}>{task.text}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                              style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem', lineHeight: 1 }}
                              title="Delete task"
                            >×</button>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="Add task (press Enter)..." 
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={handleAddTask}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {scheduleData.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No schedule blocks found.</p>
                      ) : (
                        scheduleData.map(block => (
                          <div key={block.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0.5rem', borderLeft: `3px solid ${block.energy === 'high' ? '#FF5050' : block.energy === 'med' ? '#FFB432' : block.energy === 'low' ? '#64C8FF' : 'var(--accent-green)'}`, backgroundColor: 'rgba(0,0,0,0.03)' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600, marginBottom: '2px' }}>{block.time} ({block.duration}m)</div>
                              <div style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600 }}>{block.task || 'Empty Block'}</div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteScheduleBlock(block.id); }}
                              style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', marginLeft: 'auto' }}
                              title="Delete block"
                            >×</button>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="Add schedule block (press Enter)..." 
                        value={newScheduleTask}
                        onChange={(e) => setNewScheduleTask(e.target.value)}
                        onKeyDown={handleAddSchedule}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* Routines Tab */}
                {activeTab === 'routines' && (
                  routineData.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No routines found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {routineData.map(routine => {
                        const isCompleted = routine.history && routine.history[todayStr];
                        return (
                          <div key={routine.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRoutine(routine.id); }}
                              style={{ 
                                width: '18px', height: '18px', flexShrink: 0, borderRadius: '4px', 
                                border: '2px solid #0A0A0A', 
                                backgroundColor: isCompleted ? 'var(--accent-green)' : 'transparent', 
                                cursor: 'pointer', padding: 0, marginTop: '2px',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000'
                              }}
                            >
                              {isCompleted && '✓'}
                            </button>
                            <span style={{ fontSize: '0.85rem', color: '#111', fontWeight: 600 }}>{routine.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* Dashboard Tab */}
                {(activeTab === 'dashboard' || activeTab === 'goals') && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, alignItems: 'stretch', gap: '0.5rem' }}>
                    {(() => {
                      const activeGoals = goalsData.filter(g => !g.isCompleted);
                      if (activeGoals.length === 0) {
                        return <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No active long-term goals.</p>;
                      }
                      
                      const focusId = localStorage.getItem('execute_pro_main_focus');
                      let displayGoal = activeGoals.find(g => String(g.id) === focusId);
                      
                      if (!displayGoal) {
                        let closest = activeGoals[0];
                        let minDays = Infinity;
                        activeGoals.forEach(g => {
                          const rem = Math.max(0, g.targetDays - getDaysPassed(g.startDate));
                          if (rem < minDays) {
                            minDays = rem;
                            closest = g;
                          }
                        });
                        displayGoal = closest;
                      }
                      
                      const daysPassed = getDaysPassed(displayGoal.startDate);
                      const daysLeft = Math.max(0, displayGoal.targetDays - daysPassed);
                      const isDanger = daysLeft <= 10;
                      
                      return (
                        <>
                          <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={displayGoal.id + focusTick}
                          style={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            width: '100%', flex: 1, minHeight: 0,
                            background: isDanger ? 'linear-gradient(135deg, #2a0808 0%, #1a0505 100%)' : 'linear-gradient(135deg, #111 0%, #000 100%)',
                            borderRadius: '12px', border: isDanger ? '1px solid rgba(255,50,50,0.3)' : '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            padding: '1rem',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <CollageBackground mediaList={displayGoal.media || []} />

                          {/* Style toggle button */}
                          <button
                            onClick={toggleTimerStyle}
                            style={{
                              position: 'absolute', top: '0.6rem', right: '0.6rem',
                              zIndex: 20, background: 'rgba(255,255,255,0.15)',
                              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px',
                              color: '#fff', fontSize: '0.55rem', fontWeight: 700,
                              letterSpacing: '0.1em', textTransform: 'uppercase',
                              padding: '0.2rem 0.5rem', cursor: 'pointer',
                              backdropFilter: 'blur(6px)',
                              WebkitAppRegion: 'no-drag'
                            }}
                            title="Toggle timer style"
                          >
                            {timerStyle === 'compact' ? '⬛ Cinematic' : '🔲 Compact'}
                          </button>

                          {timerStyle === 'compact' ? (
                            /* ── Style 1: Compact dark overlay ── */
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                {String(displayGoal.id) === focusId ? '⭐ Main Focus' : 'Closest Deadline'}
                              </span>
                              <h2 style={{ fontSize: '4rem', margin: 0, lineHeight: 0.9, fontFamily: 'var(--font-sans)', fontWeight: 900, color: isDanger ? '#ff4444' : '#fff', textShadow: '0 10px 20px rgba(0,0,0,0.6)' }}>
                                {daysLeft}
                              </h2>
                              <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.25rem', opacity: 0.8, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Days Left</span>
                            </div>
                          ) : (
                            /* ── Style 2: Cinematic big number ── */
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '0.5rem' }}>
                              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.25em', opacity: 0.7, marginBottom: '0.25rem', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                                {String(displayGoal.id) === focusId ? '⭐ Main Focus' : 'Closest Deadline'}
                              </span>
                              <h2 style={{
                                fontSize: 'clamp(5rem, 22vw, 8rem)',
                                margin: 0, lineHeight: 0.85,
                                fontFamily: 'var(--font-sans)', fontWeight: 900,
                                color: isDanger ? '#ff4444' : '#fff',
                                textShadow: '0 4px 40px rgba(0,0,0,0.7)',
                                letterSpacing: '-0.04em'
                              }}>
                                {daysLeft}
                              </h2>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                                <div style={{ height: '1px', width: '24px', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                <span style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#fff', opacity: 0.85, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>Days Left</span>
                                <div style={{ height: '1px', width: '24px', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                              </div>
                            </div>
                          )}
                        </motion.div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', backgroundColor: 'transparent' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleGoal(displayGoal.id); }}
                            style={{ 
                              width: '20px', height: '20px', flexShrink: 0, borderRadius: '4px', 
                              border: '2px solid #0A0A0A', 
                              backgroundColor: 'transparent', 
                              cursor: 'pointer', padding: 0,
                              display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000'
                            }}
                            title="Mark Goal as Complete"
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontSize: '0.9rem', color: '#111', fontWeight: 600, fontFamily: 'var(--font-serif)', lineHeight: 1.1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{displayGoal.title}</span>
                            <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.2rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Target: {displayGoal.targetDate ? new Date(displayGoal.targetDate).toLocaleDateString() : 'N/A'} • {displayGoal.targetDays} Day Challenge</span>
                          </div>
                        </div>
                      </>
                      );
                    })()}
                  </div>
                )}

              </div>
              
              {/* Custom Resize Handle */}
              {isOpen && (
                <div 
                  onPointerDown={startResize}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '24px',
                    height: '24px',
                    cursor: 'nwse-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderTopLeftRadius: '8px',
                    zIndex: 10,
                    WebkitAppRegion: 'no-drag'
                  }}
                  title="Drag to resize horizontally and vertically"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0A0A0A', opacity: 0.6 }}>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="3" y2="21"></line>
                  </svg>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', opacity: 0.6, pointerEvents: 'none', borderRadius: 'inherit' }}>
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
              borderRadius: '16px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              zIndex: i
            }} 
          />
        );
      })}
    </div>
  );
}
