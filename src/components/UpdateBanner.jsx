import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpdateBanner({ updateInfo, onClose }) {
  if (!updateInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        style={{
          backgroundColor: 'var(--accent-green)',
          color: '#000',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <span>🚀 Version {updateInfo.version} is available!</span>
        {updateInfo.notes && <span style={{ opacity: 0.8, fontWeight: 400 }}>({updateInfo.notes})</span>}
        <a 
          href={updateInfo.downloadUrl} 
          target="_blank" 
          rel="noreferrer"
          style={{
            background: '#000',
            color: 'var(--accent-green)',
            padding: '4px 12px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            marginLeft: 'auto',
            }}
          className="interactive"
        >
          Download Update
        </a>
        <button 
          onClick={onClose}
          className="interactive"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#000',
            
            fontSize: '1.2rem',
            lineHeight: 1,
            marginLeft: '8px',
            opacity: 0.5
          }}
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
