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

  const defaultPresets = {
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
      '--bg-color': '#18181b',
      '--text-color': '#d4d4d8',
      '--accent-green': '#a3e635',
      '--accent-orange': '#fb923c',
      '--border-color': '#27272a',
      '--card-bg': '#27272a',
      '--cell-bg': '#27272a',
      '--cell-active': '#3f3f46',
      '--header-bg': '#18181b',
      '--dim-text': '#a1a1aa',
      '--chart-bar-bg': '#3f3f46',
    }
  };

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('uiPresets');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Force update the default presets but keep any custom ones
      return { ...parsed, ...defaultPresets };
    }
    return defaultPresets;
  });

  const [cursorStyle, setCursorStyle] = useState(() => {
    const saved = localStorage.getItem('cursorStyle');
    return saved || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem('currentTheme', JSON.stringify(currentTheme));
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('cursorStyle', cursorStyle);
    if (cursorStyle !== 'default') {
      document.body.classList.add('hide-cursor');
    } else {
      document.body.classList.remove('hide-cursor');
    }
  }, [cursorStyle]);

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
      cursorStyle,
      setCursorStyle,
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
