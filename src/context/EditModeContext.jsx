import React, { createContext, useState, useEffect, useContext } from 'react';

export const EditModeContext = createContext();

export const EditModeProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [layoutState, setLayoutState] = useState(() => {
    const saved = localStorage.getItem('wysiwygLayout');
    return saved ? JSON.parse(saved) : {};
  });

  const [textState, setTextState] = useState(() => {
    const saved = localStorage.getItem('wysiwygText');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('wysiwygLayout', JSON.stringify(layoutState));
  }, [layoutState]);

  useEffect(() => {
    localStorage.setItem('wysiwygText', JSON.stringify(textState));
  }, [textState]);

  const updateWidgetPosition = (id, x, y) => {
    setLayoutState(prev => ({ ...prev, [id]: { x, y } }));
  };

  const updateTextContent = (id, content, styles) => {
    setTextState(prev => ({ ...prev, [id]: { content, styles } }));
  };

  return (
    <EditModeContext.Provider value={{
      isEditMode,
      setIsEditMode,
      layoutState,
      updateWidgetPosition,
      textState,
      updateTextContent
    }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => useContext(EditModeContext);
