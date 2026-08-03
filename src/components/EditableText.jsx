import React, { useState } from 'react';
import { useEditMode } from '../context/EditModeContext';

export default function EditableText({ id, defaultText, defaultStyles = {}, as: Component = 'span', className = '' }) {
  const { isEditMode, textState, updateTextContent } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  
  const savedState = textState[id] || { content: defaultText, styles: {} };
  
  // Merge default styles with saved overriding styles
  const currentStyles = { ...defaultStyles, ...savedState.styles };
  const currentContent = savedState.content;

  const [tempContent, setTempContent] = useState(currentContent);
  const [tempStyles, setTempStyles] = useState(savedState.styles || {}); // Only keep track of overrides

  const handleDoubleClick = (e) => {
    if (isEditMode) {
      e.stopPropagation();
      setIsEditing(true);
      setTempContent(currentContent);
      setTempStyles(savedState.styles || {});
    }
  };

  const handleSave = () => {
    updateTextContent(id, tempContent, tempStyles);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={{ position: 'relative', display: 'inline-block', zIndex: 100 }}>
        <input 
          autoFocus
          value={tempContent}
          onChange={(e) => setTempContent(e.target.value)}
          style={{ ...currentStyles, ...tempStyles, background: 'var(--card-bg)', border: '1px solid var(--accent-green)', outline: 'none' }}
          className={className}
        />
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, 
          background: 'var(--card-bg)', padding: '0.5rem', 
          border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', 
          marginTop: '0.25rem', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
        }}>
          <input 
            type="text" 
            placeholder="Size (e.g. 2rem)" 
            value={tempStyles.fontSize || ''}
            onChange={(e) => setTempStyles(prev => ({ ...prev, fontSize: e.target.value }))}
            style={{ width: '100px', fontSize: '0.75rem', padding: '0.25rem', fontFamily: 'var(--font-sans)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}
          />
          <input 
            type="color" 
            value={tempStyles.color || currentStyles.color || '#000000'}
            onChange={(e) => setTempStyles(prev => ({ ...prev, color: e.target.value }))}
            style={{ width: '30px', height: '30px', padding: 0, border: 'none', background: 'transparent' }}
          />
          <button 
            onClick={handleSave} 
            style={{ background: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <Component 
      className={className}
      onDoubleClick={handleDoubleClick}
      style={{ 
        ...currentStyles, 
        cursor: isEditMode ? 'text' : 'inherit', 
        outline: isEditMode ? '1px dashed rgba(13, 13, 13, 0.3)' : 'none',
        outlineOffset: '2px',
        userSelect: isEditMode ? 'none' : 'auto'
      }}
    >
      {currentContent}
    </Component>
  );
}
