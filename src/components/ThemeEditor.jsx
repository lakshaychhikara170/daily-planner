import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeEditor } from '../context/ThemeContext';
import { useEditMode } from '../context/EditModeContext';
import { AppContext } from '../context/AppContext';

export default function ThemeEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, presets, updateVariable, resetTheme, savePreset, loadPreset } = useThemeEditor();
  const { isEditMode, setIsEditMode } = useEditMode();
  const { isGamified, setIsGamified, soundEnabled, setSoundEnabled, levelInfo } = useContext(AppContext);
  const [presetName, setPresetName] = useState('');

  const handleSave = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim());
      setPresetName('');
    }
  };

  const applyDarkMode = () => {
    if (levelInfo.level < 5) return;
    updateVariable('--bg-color', '#121212');
    updateVariable('--text-color', '#E0E0E0');
    updateVariable('--card-bg', '#1E1E1E');
    updateVariable('--cell-bg', '#2A2A2A');
    updateVariable('--header-bg', '#121212');
    updateVariable('--border-color', '#333333');
  };

  const applyGoldAccent = () => {
    if (levelInfo.level < 10) return;
    updateVariable('--accent-green', '#FFD700');
  };

  const controls = [
    { label: 'Background', key: '--bg-color', type: 'color' },
    { label: 'Text', key: '--text-color', type: 'color' },
    { label: 'Accent', key: '--accent-green', type: 'color' },
    { label: 'Card BG', key: '--card-bg', type: 'color' },
    { label: 'Cell BG', key: '--cell-bg', type: 'color' },
    { label: 'Header BG', key: '--header-bg', type: 'color' },
    { label: 'Border', key: '--border-color', type: 'text' },
  ];

  return (
    <>
      <button
        className="interactive"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--text-color)',
          color: 'var(--bg-color)',
          border: 'none',
          borderRadius: '999px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          cursor: 'none'
        }}
      >
        {isOpen ? 'Close Editor' : 'Edit UI'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              width: '320px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              zIndex: 9998,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
              Theme & Settings
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0.5rem', background: isGamified ? 'var(--accent-green)' : 'transparent', color: isGamified ? '#000' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Gamified Mode</span>
              <button 
                onClick={() => setIsGamified(!isGamified)}
                className="interactive"
                style={{ padding: '0.25rem 0.75rem', background: isGamified ? '#000' : 'var(--text-color)', color: isGamified ? 'var(--accent-green)' : 'var(--bg-color)', border: 'none', borderRadius: '4px', cursor: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600 }}
              >
                {isGamified ? 'ON' : 'OFF'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0.5rem', background: soundEnabled ? 'var(--accent-green)' : 'transparent', color: soundEnabled ? '#000' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Sound Effects</span>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="interactive"
                style={{ padding: '0.25rem 0.75rem', background: soundEnabled ? '#000' : 'var(--text-color)', color: soundEnabled ? 'var(--accent-green)' : 'var(--bg-color)', border: 'none', borderRadius: '4px', cursor: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600 }}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0.5rem', background: isEditMode ? 'var(--accent-green)' : 'transparent', color: isEditMode ? '#000' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>WYSIWYG Edit Mode</span>
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className="interactive"
                style={{ padding: '0.25rem 0.75rem', background: isEditMode ? '#000' : 'var(--text-color)', color: isEditMode ? 'var(--accent-green)' : 'var(--bg-color)', border: 'none', borderRadius: '4px', cursor: 'none' }}
              >
                {isEditMode ? 'ON' : 'OFF'}
              </button>
            </div>

            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}>Unlockable Cosmetics</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={applyDarkMode}
                className="interactive"
                style={{ 
                  flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', 
                  color: levelInfo.level >= 5 ? 'var(--text-color)' : 'var(--dim-text)', cursor: levelInfo.level >= 5 ? 'pointer' : 'not-allowed', 
                  fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600,
                  opacity: levelInfo.level >= 5 ? 1 : 0.5
                }}
              >
                {levelInfo.level >= 5 ? 'Dark Mode' : '🔒 Lvl 5'}
              </button>
              <button 
                onClick={applyGoldAccent}
                className="interactive"
                style={{ 
                  flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', 
                  color: levelInfo.level >= 10 ? 'var(--text-color)' : 'var(--dim-text)', cursor: levelInfo.level >= 10 ? 'pointer' : 'not-allowed', 
                  fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600,
                  opacity: levelInfo.level >= 10 ? 1 : 0.5
                }}
              >
                {levelInfo.level >= 10 ? 'Gold Accent' : '🔒 Lvl 10'}
              </button>
            </div>

            {levelInfo.level < 15 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-color)', border: '1px dashed var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-sans)', marginBottom: '0.25rem' }}>Custom Theme Editor Locked</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--dim-text)' }}>Reach Level 15 or purchase a Pro License to unlock granular color controls.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {controls.map(control => (
                    <div key={control.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', opacity: 0.8, fontFamily: 'var(--font-sans)' }}>{control.label}</label>
                      <input
                        type={control.type}
                        value={currentTheme[control.key] || ''}
                        onChange={(e) => updateVariable(control.key, e.target.value)}
                        style={{ 
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-color)',
                          padding: control.type === 'color' ? '0' : '0.25rem 0.5rem',
                          width: control.type === 'color' ? '30px' : '100px',
                          height: control.type === 'color' ? '30px' : 'auto',
                          cursor: 'none',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.75rem'
                        }}
                        className="interactive"
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <button 
                    onClick={resetTheme}
                    className="interactive"
                    style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--text-color)', color: 'var(--text-color)', cursor: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Reset Default
                  </button>
                </div>
              </>
            )}

            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}>Saved Presets</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Preset Name..."
                className="interactive"
                style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', cursor: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}
              />
              <button 
                onClick={handleSave}
                className="interactive"
                style={{ padding: '0.5rem 1rem', background: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', cursor: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Save
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.keys(presets).map(name => (
                <button
                  key={name}
                  className="interactive"
                  onClick={() => loadPreset(name)}
                  style={{ 
                    padding: '0.5rem', 
                    background: 'transparent', 
                    border: '1px solid var(--border-color)',
                    textAlign: 'left',
                    color: 'var(--text-color)',
                    cursor: 'none',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem'
                  }}
                >
                  {name}
                </button>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
