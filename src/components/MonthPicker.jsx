import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function MonthPicker({ isOpen, onClose, viewingYear, setViewingYear, viewingMonth, setViewingMonth }) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 100,
              backgroundColor: 'transparent' // Invisible backdrop just to catch clicks outside
            }}
          />
          
          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 1rem)',
              right: 0,
              zIndex: 101,
              backgroundColor: '#0A0A0A',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '320px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Year Selector */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #222' 
            }}>
              <button 
                className="interactive"
                onClick={() => setViewingYear(prev => prev - 1)}
                style={{ 
                  background: 'transparent', border: '1px solid #333', color: '#F0EEE9', 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              
              <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 'bold', color: '#F0EEE9' }}>
                {viewingYear}
              </span>
              
              <button 
                className="interactive"
                onClick={() => setViewingYear(prev => prev + 1)}
                style={{ 
                  background: 'transparent', border: '1px solid #333', color: '#F0EEE9', 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            {/* Months Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {months.map((month, index) => {
                const isActive = viewingMonth === index;
                return (
                  <button
                    key={month}
                    className="interactive"
                    onClick={() => {
                      setViewingMonth(index);
                      onClose();
                    }}
                    style={{
                      background: isActive ? '#D4F536' : 'transparent',
                      color: isActive ? '#000' : '#8A8A85',
                      border: '1px solid',
                      borderColor: isActive ? '#D4F536' : '#222',
                      borderRadius: '8px',
                      padding: '0.75rem 0',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: isActive ? 'bold' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = '#555';
                        e.currentTarget.style.color = '#F0EEE9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = '#222';
                        e.currentTarget.style.color = '#8A8A85';
                      }
                    }}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                className="interactive"
                onClick={() => {
                  const now = new Date();
                  setViewingYear(now.getFullYear());
                  setViewingMonth(now.getMonth());
                  onClose();
                }}
                style={{
                  background: 'transparent', border: 'none', color: '#8A8A85',
                  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                  cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Go to Today
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MonthPicker;
