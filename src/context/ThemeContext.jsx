import React, { createContext, useState, useEffect, useContext } from 'react';

const defaultTheme = {
  '--bg-color': '#f1efeb',
  '--text-color': '#0d0d0d',
  '--accent-green': '#c4f346',
  '--accent-orange': '#f25537',
  '--border-color': 'rgba(13, 13, 13, 0.1)',
  '--card-bg': '#ffffff',
  '--cell-bg': '#f0f0f0',
  '--cell-active': '#ffffff',
  '--header-bg': '#f5f5f5',
  '--dim-text': '#888888',
  '--chart-bar-bg': '#eaeaea',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('currentTheme');
    return saved ? JSON.parse(saved) : { ...defaultTheme };
  });

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('uiPresets');
    return saved ? JSON.parse(saved) : {
      'Editorial Minimal': {
        '--bg-color': '#F0EEE9',
        '--text-color': '#1A1A1A',
        '--accent-green': '#D4F536',
        '--accent-orange': '#f25537',
        '--border-color': '#E5E5E5',
        '--card-bg': '#FFFFFF',
        '--cell-bg': '#F0EEE9',
        '--cell-active': '#FFFFFF',
        '--header-bg': '#F0EEE9',
        '--dim-text': '#8A8A85',
        '--chart-bar-bg': '#1A1A1A',
      },
      'Dark Slate': {
        '--bg-color': '#0f1115',
        '--text-color': '#f8f9fa',
        '--accent-green': '#00ff88',
        '--accent-orange': '#ff5555',
        '--border-color': 'rgba(255,255,255,0.1)',
        '--card-bg': '#16191f',
        '--cell-bg': '#16191f',
        '--cell-active': '#1e2229',
        '--header-bg': '#111317',
        '--dim-text': '#7a8599',
        '--chart-bar-bg': '#2a303c',
      }
    };
  });

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem('currentTheme', JSON.stringify(currentTheme));
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('uiPresets', JSON.stringify(presets));
  }, [presets]);

  const updateVariable = (key, value) => {
    setCurrentTheme(prev => ({ ...prev, [key]: value }));
  };

  const resetTheme = () => {
    setCurrentTheme({ ...defaultTheme });
  };

  const savePreset = (name) => {
    if (!name) return;
    setPresets(prev => ({ ...prev, [name]: { ...currentTheme } }));
  };

  const loadPreset = (name) => {
    if (presets[name]) {
      setCurrentTheme({ ...presets[name] });
    }
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      presets,
      updateVariable,
      resetTheme,
      savePreset,
      loadPreset
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeEditor = () => useContext(ThemeContext);
