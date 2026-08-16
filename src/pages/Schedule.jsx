import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const parseTime = (timeStr) => {
  if (!timeStr) return -1;
  // Check for AM/PM format (legacy migration)
  const match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1]);
    let mins = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  // Check for HH:mm format
  const [h, m] = String(timeStr).split(':');
  if (h !== undefined && m !== undefined && !isNaN(h) && !isNaN(m)) {
    return parseInt(h) * 60 + parseInt(m);
  }
  return -1;
};

const formatTime24 = (totalMins) => {
  let h = Math.floor(totalMins / 60);
  let m = totalMins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const energyColors = { 
  none: 'transparent', 
  low: 'rgba(100, 200, 255, 0.15)', 
  med: 'rgba(255, 180, 50, 0.15)', 
  high: 'rgba(255, 80, 80, 0.2)' 
};
const energyNext = { none: 'low', low: 'med', med: 'high', high: 'none' };

const LiveTooltip = ({ block }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const blockMins = parseTime(block.time);
  if (blockMins === -1) return null;

  const blockDuration = block.duration || 60;
  const nowMs = now.getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const startMs = today.getTime() + blockMins * 60 * 1000;
  const endMs = startMs + (blockDuration * 60 * 1000);

  let timeStatus = "";
  if (nowMs < startMs) {
    const diffS = Math.floor((startMs - nowMs) / 1000);
    const h = Math.floor(diffS / 3600);
    const m = Math.floor((diffS % 3600) / 60);
    const s = diffS % 60;
    timeStatus = `STARTS IN ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else if (nowMs >= startMs && nowMs < endMs) {
    const diffS = Math.floor((endMs - nowMs) / 1000);
    const h = Math.floor(diffS / 3600);
    const m = Math.floor((diffS % 3600) / 60);
    const s = diffS % 60;
    timeStatus = `ENDS IN ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    timeStatus = `ENDED`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        zIndex: 10,
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {timeStatus}
    </motion.div>
  );
};

function Schedule() {
  const { tasks, setTrackedTask, setFocusTimeLeft, setCountdown, addPoints } = useContext(AppContext);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [scheduleBlocks, setScheduleBlocks] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerScheduleV2');
    let blocks = saved ? JSON.parse(saved) : [
      { id: 1, time: '08:00', duration: 60, task: 'Deep Work', energy: 'high' },
      { id: 2, time: '11:00', duration: 60, task: 'Sync', energy: 'med' }
    ];
    // Migration: convert old AM/PM to 24h format and ensure duration exists
    return blocks.map(b => {
      let t = b.time;
      if (t && t.includes('M')) {
         const mins = parseTime(t);
         if (mins !== -1) {
            t = formatTime24(mins);
         } else {
            const now = new Date();
            t = formatTime24(now.getHours() * 60 + now.getMinutes());
         }
      }
      // If the block is completely empty and happens to have 09:00, let's update it to current time just in case it's a stale empty block
      if (!b.task && b.time === '09:00') {
         const now = new Date();
         t = formatTime24(now.getHours() * 60 + now.getMinutes());
      }
      return { ...b, time: t, duration: b.duration || 60 };
    });
  });

  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerTemplates');
    return saved ? JSON.parse(saved) : {};
  });
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    localStorage.setItem('dailyPlannerScheduleV2', JSON.stringify(scheduleBlocks));
    // Dispatch so StickyWidget can pick it up instantly
    window.dispatchEvent(new CustomEvent('scheduleUpdated', { detail: { source: 'SchedulePage' } }));
  }, [scheduleBlocks]);

  // Listen for changes coming from StickyWidget (if widget adds ability to edit schedule) or Cloud Sync
  useEffect(() => {
    const handleScheduleUpdated = (e) => {
      // Prevent infinite loop by ignoring our own events
      if (e.detail && e.detail.source === 'SchedulePage') return;
      
      const saved = localStorage.getItem('dailyPlannerScheduleV2');
      if (saved) {
        setScheduleBlocks(JSON.parse(saved));
      }
    };
    window.addEventListener('scheduleUpdated', handleScheduleUpdated);
    window.addEventListener('cloudDataLoaded', handleScheduleUpdated);
    return () => {
      window.removeEventListener('scheduleUpdated', handleScheduleUpdated);
      window.removeEventListener('cloudDataLoaded', handleScheduleUpdated);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyPlannerTemplates', JSON.stringify(templates));
  }, [templates]);
  
  const updateBlock = (id, field, value) => {
    setScheduleBlocks(blocks => blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => {
    setScheduleBlocks(blocks => blocks.filter(b => b.id !== id));
  };

  const [editModal, setEditModal] = useState(null);

  const handleAddClick = () => {
    const now = new Date();
    const currentTimeStr = formatTime24(now.getHours() * 60 + now.getMinutes());
    setEditModal({ id: null, task: '', time: currentTimeStr, duration: 60, energy: 'none' });
  };

  const handleEditClick = (block) => {
    let defaultTime = block.time;
    // If block is empty, default to the exact current time
    if (!block.task || !block.task.trim()) {
      const now = new Date();
      defaultTime = formatTime24(now.getHours() * 60 + now.getMinutes());
    }
    setEditModal({ ...block, time: defaultTime });
  };

  const confirmEditBlock = () => {
    if (!editModal || !editModal.task.trim()) return;
    if (editModal.id) {
       setScheduleBlocks(blocks => blocks.map(b => b.id === editModal.id ? editModal : b));
    } else {
       const newId = scheduleBlocks.length > 0 ? Math.max(...scheduleBlocks.map(b => b.id)) + 1 : 1;
       setScheduleBlocks([...scheduleBlocks, { ...editModal, id: newId }]);
    }
    setEditModal(null);
  };

  const saveTemplate = () => {
    if (templateName.trim()) {
      setTemplates({ ...templates, [templateName.trim()]: scheduleBlocks });
      setTemplateName('');
    }
  };

  const loadTemplate = (name) => {
    if (templates[name]) {
      setScheduleBlocks(templates[name].map(b => ({ ...b, id: Date.now() + Math.random() }))); 
    }
  };

  const deleteTemplate = (name) => {
    const newTemps = { ...templates };
    delete newTemps[name];
    setTemplates(newTemps);
  };

  const [showTools, setShowTools] = useState(false);

  const autoSlotTasks = () => {
    const uncompleted = tasks.filter(t => !t.completed);
    if (uncompleted.length === 0) return;

    const now = new Date();
    let startTimeMins = now.getHours() * 60 + now.getMinutes(); // current time default
    if (scheduleBlocks.length > 0) {
      const lastBlock = scheduleBlocks[scheduleBlocks.length - 1];
      const m = parseTime(lastBlock.time);
      if (m !== -1) startTimeMins = m + 60; // Start 1 hour after last block
    }

    let newId = scheduleBlocks.length > 0 ? Math.max(...scheduleBlocks.map(b => b.id)) + 1 : 1;
    const newBlocks = uncompleted.map((task, i) => {
      return {
        id: newId + i,
        time: formatTime24(startTimeMins + (i * 60)),
        duration: 60,
        task: task.text,
        energy: 'med'
      };
    });

    setScheduleBlocks([...scheduleBlocks, ...newBlocks]);
  };

  const [toast, setToast] = useState({ visible: false, message: '', color: '' });
  
  const showToast = (message, color) => {
    setToast({ visible: true, message, color });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [hoverTimer, setHoverTimer] = useState(null);

  const handleMouseEnter = (id) => {
    const timer = setTimeout(() => setHoveredBlockId(id), 800); // Show after 0.8s hover
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setHoveredBlockId(null);
  };

  return (
    <main className="px-content py-section" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', minHeight: 'calc(100vh - 80px)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Energy Mode Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              zIndex: 9999,
              backgroundColor: '#1a1a1a',
              border: `1px solid ${toast.color || 'rgba(255,255,255,0.2)'}`,
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              color: 'white',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: toast.color || 'transparent', border: toast.color ? 'none' : '1px solid white' }} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Add Block Modal */}
      <AnimatePresence>
        {editModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '2rem',
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-green)' }}>
                {editModal.id ? 'Edit Time Block' : 'Add Time Block'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Task Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={editModal.task}
                  onChange={e => setEditModal({...editModal, task: e.target.value})}
                  placeholder="e.g. Deep Work"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '8px', color: 'white', outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Time</label>
                  <input 
                    type="time" 
                    value={editModal.time}
                    onChange={e => setEditModal({...editModal, time: e.target.value})}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '8px', color: 'white', outline: 'none', fontFamily: 'var(--font-sans)' }}
                  />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Duration (mins)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={editModal.duration}
                    onChange={e => setEditModal({...editModal, duration: parseInt(e.target.value) || 0})}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '8px', color: 'white', outline: 'none', fontFamily: 'var(--font-sans)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => setEditModal(null)}
                  className="interactive"
                  style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmEditBlock}
                  disabled={!editModal.task.trim()}
                  className="interactive"
                  style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-green)', border: 'none', color: 'black', borderRadius: '8px', fontWeight: 'bold', cursor: editModal.task.trim() ? 'pointer' : 'not-allowed', opacity: editModal.task.trim() ? 1 : 0.5, fontFamily: 'var(--font-sans)' }}
                >
                  {editModal.id ? 'Save Changes' : 'Add Block'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ 
        position: 'absolute', 
        top: '10%', 
        left: '20%', 
        width: '300px', 
        height: '300px', 
        backgroundColor: 'var(--accent-green)', 
        filter: 'blur(150px)', 
        opacity: 0.15,
        borderRadius: '50%'
      }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ marginBottom: '6vh', position: 'relative', zIndex: 1 }}
      >
        <h1 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: 'clamp(2.5rem, 8vw, 8rem)', 
          lineHeight: 1.05, 
          margin: 0, 
          letterSpacing: '-0.03em',
          color: 'white'
        }}>
          Time is <span className="italic" style={{ opacity: 0.5 }}>ruthless</span>.<br/>
          Spend it <span style={{ backgroundColor: 'var(--accent-green)', color: 'black', padding: '0 0.2em', display: 'inline-block', lineHeight: 1 }}>Wisely.</span>
        </h1>
      </motion.div>

      <div style={{ maxWidth: '1400px', position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <span style={{ color: 'var(--accent-green)' }}>●</span>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-green)' }}>02 / Schedule</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', letterSpacing: '-0.02em', color: 'white' }}>
              Time you <span className="italic">actually use.</span>
            </h2>
            <p style={{ opacity: 0.7, maxWidth: '600px', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
              Add custom blocks to define your focus windows. Drop the strict hours.
            </p>
          </div>

          {/* AI Tools & Templates */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowTools(!showTools)}
              className="interactive"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: 'white', 
                padding: '0.75rem 1.25rem', 
                borderRadius: '999px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontWeight: 'bold', 
                fontSize: '0.9rem',
                fontFamily: 'var(--font-sans)',
                transition: 'background 0.3s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <span>🛠️</span> <span>Tools & Templates</span>
            </button>

            <AnimatePresence>
              {showTools && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 10px)', 
                    right: 0, 
                    width: '320px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.5rem', 
                    background: '#1a1a1a', 
                    padding: '1.5rem', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.8)', 
                    zIndex: 50 
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Planner</div>
                    <button 
                      onClick={() => { autoSlotTasks(); setShowTools(false); }}
                      className="interactive"
                      style={{ width: '100%', padding: '0.8rem', background: 'var(--accent-green)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <span>🤖</span> Auto-Fill Tasks
                    </button>
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Templates</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="Template Name..."
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.6rem', fontSize: '0.85rem', borderRadius: '6px', outline: 'none' }}
                      />
                      <button onClick={saveTemplate} className="interactive" style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {Object.keys(templates).map(tName => (
                        <div key={tName} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                          <button onClick={() => { loadTemplate(tName); setShowTools(false); }} className="interactive" style={{ padding: '0.5rem 0.8rem', background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>{tName}</button>
                          <button onClick={() => deleteTemplate(tName)} className="interactive" style={{ padding: '0.5rem 0.6rem', background: 'rgba(255,0,0,0.2)', border: 'none', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Reorder.Group axis="y" values={scheduleBlocks} onReorder={setScheduleBlocks} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <AnimatePresence>
              {scheduleBlocks.map((block, index) => {
                const blockMins = parseTime(block.time);
                const blockDuration = block.duration || 60;
                const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                const isActive = block.task && block.task.trim() !== '' && blockMins !== -1 && currentMins >= blockMins && currentMins < (blockMins + blockDuration);

                return (
                  <Reorder.Item 
                    key={block.id} 
                    value={block}
                    tick={currentTime.getTime()}
                    className="schedule-block" 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onMouseEnter={() => handleMouseEnter(block.id)}
                    onMouseLeave={handleMouseLeave}
                    style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative', background: block.energy ? energyColors[block.energy] : 'transparent' }}
                  >
                    <AnimatePresence>
                      {hoveredBlockId === block.id && <LiveTooltip block={block} />}
                    </AnimatePresence>
                    {isActive && (
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)', zIndex: 10 }} 
                      />
                    )}

                    <div className="schedule-hour" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '130px', borderRight: '1px solid rgba(255,255,255,0.1)', marginRight: '1rem', paddingLeft: isActive ? '1.5rem' : '0.5rem', transition: 'padding 0.3s ease', position: 'relative' }}>
                      {isActive && (
                         <div style={{ fontSize: '0.6rem', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Active Now</div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input 
                          type="time"
                          className="schedule-input interactive"
                          value={block.time}
                          onClick={(e) => {
                            if (!block.task) {
                              e.preventDefault();
                              handleEditClick(block);
                            }
                          }}
                          onChange={(e) => updateBlock(block.id, 'time', e.target.value)}
                          style={{ fontSize: '1rem', fontFamily: 'var(--font-sans)', opacity: isActive ? 1 : 0.9, color: isActive ? 'var(--accent-green)' : 'inherit', width: '100%', cursor: !block.task ? 'pointer' : 'pointer', padding: 0 }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.4rem', opacity: 0.8 }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>🕒</span>
                        <input 
                          type="number"
                          min="1"
                          title="Edit Duration"
                          className="schedule-input interactive"
                          value={block.duration}
                          onClick={(e) => {
                            if (!block.task) {
                              e.preventDefault();
                              handleEditClick(block);
                            }
                          }}
                          onChange={(e) => updateBlock(block.id, 'duration', parseInt(e.target.value) || 0)}
                          style={{ 
                            width: '45px', 
                            fontSize: '0.85rem', 
                            textAlign: 'center', 
                            padding: '0.2rem', 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            borderRadius: '4px',
                            color: 'white',
                            cursor: !block.task ? 'pointer' : 'text'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>mins</span>
                      </div>
                    </div>
                    
                    <div className="schedule-content interactive" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                      <button 
                        title="Toggle Energy Level"
                        onClick={() => {
                          const next = energyNext[block.energy || 'none'];
                          updateBlock(block.id, 'energy', next);
                          const energyNames = { high: 'High Energy', med: 'Medium Energy', low: 'Low Energy', none: 'No Energy' };
                          showToast(`${energyNames[next]} Mode`, energyColors[next] || 'rgba(255,255,255,0.2)');
                        }}
                        className="interactive"
                        style={{ 
                          width: '16px', height: '16px', borderRadius: '50%', marginRight: '1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.3)',
                          backgroundColor: block.energy === 'high' ? '#FF5050' : block.energy === 'med' ? '#FFB432' : block.energy === 'low' ? '#64C8FF' : 'transparent'
                        }}
                      />

                      <input 
                        type="text"
                        onClick={() => {
                          if (!block.task) {
                            handleEditClick(block);
                          }
                        }}
                        className={block.task ? "schedule-input schedule-filled interactive" : "schedule-input interactive"}
                        placeholder="Type your focus..."
                        value={block.task}
                        onChange={(e) => updateBlock(block.id, 'task', e.target.value)}
                        style={{ 
                          textDecoration: block.completed ? 'line-through' : 'none', 
                          opacity: block.completed ? 0.5 : 1, 
                          width: '100%',
                          cursor: !block.task ? 'pointer' : 'text'
                        }}
                      />
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                        <button 
                          className="interactive" 
                          onClick={() => {
                            if (!block.completed) {
                              updateBlock(block.id, 'completed', true);
                              addPoints(200);
                            } else {
                              updateBlock(block.id, 'completed', false);
                              addPoints(-200);
                            }
                          }}
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            border: `2px solid ${block.completed ? 'var(--accent-green)' : 'rgba(255,255,255,0.2)'}`,
                            backgroundColor: block.completed ? 'var(--accent-green)' : 'transparent',
                            color: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
                          }}
                        >
                          {block.completed && '✓'}
                        </button>

                        {!block.completed && (
                          <button 
                            className="interactive"
                            onClick={() => {
                              if (!block.task) return;
                              setTrackedTask(block.task);
                              setFocusTimeLeft(blockDuration > 0 ? blockDuration * 60 : 25 * 60);
                              setCountdown(3);
                            }}
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '999px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--accent-green)',
                              color: 'var(--accent-green)',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ▶ Focus ({blockDuration}m)
                          </button>
                        )}
                        
                        <button className="delete-btn interactive" onClick={() => removeBlock(block.id)} style={{ opacity: 0.5, border: 'none', background: 'transparent', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                      </div>
                    </div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
          
          <div 
            className="interactive"
            onClick={handleAddClick}
            style={{ 
              padding: '1.5rem 0', 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              opacity: 0.5, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'opacity 0.2s',
              color: '#fff'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
          >
             <span style={{ fontSize: '1.2rem' }}>+</span> 
             <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.2rem' }}>Add a time block...</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Schedule;
