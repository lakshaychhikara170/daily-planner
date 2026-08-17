import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { saveMediaBlob, deleteMediaBlob, getMediaBlob } from '../utils/storage';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

function Tasks() {
  const { 
    tasks, setTasks,
    activeTask, setActiveTask,
    addPoints, updateQuest,
    setTrackedTask, setIsFocusMode, setFocusTimeLeft, setIsFocusTimerActive, setCountdown
  } = useContext(AppContext);
  
  const { user } = useContext(AuthContext);
  const { showConfirm, addToast, showCelebration } = useUI();
  
  const [isAddingTask, setIsAddingTask] = useState(true); 
  const [newTaskText, setNewTaskText] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const updateTaskDetails = (id, details) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, details } : t));
    if (activeTask && activeTask.id === id) setActiveTask(prev => ({ ...prev, details }));
  };

  const updateTaskDeadline = (id, newDeadline) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, deadline: newDeadline } : t));
    if (activeTask && activeTask.id === id) setActiveTask(prev => ({ ...prev, deadline: newDeadline }));
  };

  const processFile = async (file) => {
    if (!file || !activeTask) return;
    
    const mediaId = await saveMediaBlob(file, user?.uid);
    const newMediaObj = {
      id: mediaId,
      type: file.type,
      x: 20 + Math.random() * 50,
      y: 20 + Math.random() * 50,
      width: 250,
      height: 250,
      zIndex: 1
    };

    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(t => {
        if (t.id === activeTask.id) {
          return { ...t, media: [...(t.media || []), newMediaObj] };
        }
        return t;
      });
      return updatedTasks;
    });
    
    setActiveTask(prev => {
      if (!prev) return prev;
      return { ...prev, media: [...(prev.media || []), newMediaObj] };
    });
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = ''; // reset
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

  const deleteMedia = async (taskId, mediaId) => {
    await deleteMediaBlob(mediaId, user?.uid);
    const currentMedia = tasks.find(t => t.id === taskId)?.media || [];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, media: currentMedia.filter(m => m.id !== mediaId) } : t));
    if (activeTask && activeTask.id === taskId) setActiveTask(prev => ({ ...prev, media: currentMedia.filter(m => m.id !== mediaId) }));
  };

  const bringToFront = (taskId, mediaId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.media) return;
    
    const highestZ = Math.max(0, ...task.media.map(m => m.zIndex || 1));
    const newMedia = task.media.map(m => m.id === mediaId ? { ...m, zIndex: highestZ + 1 } : m);
    
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, media: newMedia } : t));
    if (activeTask && activeTask.id === taskId) setActiveTask(prev => ({ ...prev, media: newMedia }));
  };

  useEffect(() => {
    localStorage.setItem('dailyPlannerTasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isNowCompleted = !task.completed;
        let pointsDiff = 0;
        let newCompletedAt = task.completedAt;
        
        if (isNowCompleted) {
          pointsDiff = 500;
          newCompletedAt = new Date().toISOString();
          if (updateQuest) updateQuest('tasks', 1);
          addToast('Task completed.', 'success');
          
          // Check if this makes all tasks completed
          const allTasksCompleted = prev.every(t => t.id === task.id || t.completed);
          if (allTasksCompleted && prev.length > 0) {
            showCelebration({
              title: "Perfect day.",
              subtitle: "All tasks completed",
              details: "You've executed every action item on your list today. Keep the momentum going.",
              primaryAction: { label: "Continue" }
            });
          }
        } else {
          pointsDiff = -500;
          newCompletedAt = null;
        }
        
        addPoints(pointsDiff);
        return { ...task, completed: isNowCompleted, completedAt: newCompletedAt };
      }
      return task;
    }));
  };

  const removeTask = (e, id) => {
    e.stopPropagation();
    showConfirm({
      title: "Delete this task?",
      message: "This will remove the task permanently.",
      confirmText: "Delete Task",
      isDestructive: true,
      onConfirm: () => {
        setTasks(tasks.filter(t => t.id !== id));
        addToast("Task deleted.");
      }
    });
  };

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && newTaskText.trim() !== '') {
      const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
      setTasks([{ id: newId, text: newTaskText.trim(), completed: false, createdAt: new Date().toISOString() }, ...tasks]);
      setNewTaskText('');
    }
  };

  return (
    <main className="px-content py-section">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ marginBottom: '12vh', position: 'relative', zIndex: 1 }}
      >
        <h1 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: 'clamp(2.5rem, 8vw, 8rem)', 
          lineHeight: 1.05, 
          margin: 0, 
          letterSpacing: '-0.03em',
          color: 'var(--text-color)'
        }}>
          Motion is <span className="italic" style={{ opacity: 0.6 }}>fake</span> progress.<br/>
          Action is <span style={{ backgroundColor: 'var(--accent-green)', padding: '0 0.2em', display: 'inline-block', lineHeight: 1 }}>Real.</span>
        </h1>
      </motion.div>

      <div style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
          <span style={{ color: 'var(--accent-orange)' }}>●</span>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>01 / Action Items</span>
        </div>
        
        <h3 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Execution <span className="italic">only.</span>
        </h3>
        <p style={{ opacity: 0.7, marginBottom: '3rem', maxWidth: '400px', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Drop the busywork. List the high-leverage tasks that actually move the needle, cross them out, and get your time back.
        </p>

        <AnimatePresence>
          {isAddingTask && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '1rem' }}
            >
              <input 
                autoFocus
                type="text" 
                className="routine-input interactive"
                style={{ padding: '1rem 0', borderBottom: '1px solid var(--text-color)' }}
                placeholder="Type task and press Enter..." 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={handleAddTask}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Reorder.Group axis="y" values={tasks} onReorder={setTasks} style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
          <AnimatePresence>
            {tasks.map((task) => (
              <Reorder.Item 
                key={task.id} 
                value={task}
                className="interactive task-row"
                onClick={() => setActiveTask(task)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: task.completed ? 0.5 : 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.5rem',
                  padding: '1.25rem 0',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  cursor: 'grab'
                }}
                whileDrag={{ scale: 1.02, backgroundColor: 'var(--card-bg)', cursor: 'grabbing', zIndex: 50, padding: '1.25rem 1rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              >
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                  style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  border: '1px solid var(--text-color)',
                  backgroundColor: task.completed ? 'var(--text-color)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bg-color)',
                  flexShrink: 0,
                  cursor: 'pointer'
                }}>
                  {task.completed && '✓'}
                </div>
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                  style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', textDecoration: task.completed ? 'line-through' : 'none', cursor: 'pointer' }}
                >
                  {task.text}
                </span>
                <div style={{ flex: 1 }} />
                <button className="delete-btn interactive" onClick={(e) => removeTask(e, task.id)}>×</button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      <AnimatePresence>
        {activeTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveTask(null)}
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
                  <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', lineHeight: 1.1, margin: '0 0 0.5rem 0' }}>{activeTask.text}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--dim-text)', letterSpacing: '0.1em' }}>Deadline:</span>
                    <input 
                      type="datetime-local" 
                      value={activeTask.deadline && !isNaN(new Date(activeTask.deadline).getTime()) ? new Date(new Date(activeTask.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          updateTaskDeadline(activeTask.id, new Date(e.target.value).toISOString());
                        } else {
                          updateTaskDeadline(activeTask.id, null);
                        }
                      }}
                      className="interactive"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: activeTask.deadline ? 'var(--accent-green)' : 'var(--text-color)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-sans)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
                
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
                  placeholder="Add task details..."
                  value={activeTask.details || ''}
                  onChange={e => updateTaskDetails(activeTask.id, e.target.value)}
                  style={{
                    width: '100%', height: '100%', backgroundColor: 'transparent', border: 'none', resize: 'none',
                    outline: 'none', color: 'var(--text-color)', fontSize: '1.1rem',
                    fontFamily: 'var(--font-serif)', lineHeight: '1.6', position: 'absolute', top: 0, left: 0, zIndex: 1
                  }}
                />
                
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, pointerEvents: 'none' }}>
                  {(activeTask.media || []).map(m => (
                    <MediaElement 
                      key={m.id} 
                      media={m} 
                      onUpdate={(newPos) => {
                        const newMedia = (activeTask.media || []).map(item => item.id === m.id ? { ...item, ...newPos } : item);
                        setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, media: newMedia } : t));
                        setActiveTask(prev => ({ ...prev, media: newMedia }));
                      }}
                      onDelete={() => deleteMedia(activeTask.id, m.id)}
                      onBringToFront={() => bringToFront(activeTask.id, m.id)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ 
                  fontFamily: 'var(--font-serif)', 
                  fontStyle: 'italic', 
                  fontSize: '1.25rem', 
                  color: 'var(--text-color)', 
                  opacity: 0.7, 
                  marginBottom: '1rem',
                  letterSpacing: '0.02em'
                }}>
                  Ready to execute? Start working on this task.
                </span>
                
                <button
                  className="interactive"
                  onClick={() => {
                    setTrackedTask(activeTask);
                    setIsFocusMode(true);
                    setFocusTimeLeft(25 * 60);
                    setIsFocusTimerActive(false);
                    setCountdown(null);
                    if (document.documentElement.requestFullscreen) {
                      document.documentElement.requestFullscreen().catch(err => console.log(err));
                    }
                  }}
                  title="Start Deep Work"
                  style={{
                    width: '100%', padding: '1.5rem', backgroundColor: 'var(--text-color)',
                    color: 'var(--bg-color)', border: 'none', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', borderRadius: '4px',
                    fontFamily: 'var(--font-sans)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                    zIndex: 10, transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  <span>Focus Timer</span>
                </button>
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
    getMediaBlob(media.id, null).then(blob => {
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
        pointerEvents: 'auto', // Important so we can interact with it on top of the textarea
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

export default Tasks;
