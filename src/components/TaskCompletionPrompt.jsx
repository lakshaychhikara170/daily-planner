import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';

function TaskCompletionPrompt() {
  const { 
    showCompletionPrompt, setShowCompletionPrompt,
    trackedTask, setTrackedTask,
    tasks, setTasks
  } = useContext(AppContext);

  if (!showCompletionPrompt || !trackedTask) return null;

  const handleComplete = () => {
    // Mark as complete in tasks
    setTasks(tasks.map(t => t.id === trackedTask.id ? { ...t, completed: true } : t));
    setShowCompletionPrompt(false);
    setTrackedTask(null); 
  };

  const handleNotYet = () => {
    setShowCompletionPrompt(false);
    setTrackedTask(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            backgroundColor: 'var(--bg-color)',
            padding: '4rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}
        >
          <div style={{ color: '#D4F536', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', lineHeight: 1.1 }}>
            Timer Finished
          </h2>
          <p style={{ opacity: 0.7, marginBottom: '3rem', fontSize: '1.1rem' }}>
            Did you complete "{trackedTask.text}"?
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="interactive"
              onClick={handleComplete}
              style={{
                backgroundColor: '#D4F536',
                color: '#000',
                border: 'none',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Mark as Done
            </button>
            <button
              className="interactive"
              onClick={handleNotYet}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Not Yet
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TaskCompletionPrompt;
