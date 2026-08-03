import React from 'react';
import { motion } from 'framer-motion';
import { useEditMode } from '../context/EditModeContext';

export default function EditableWidget({ id, children, style = {}, className = '' }) {
  const { isEditMode, layoutState, updateWidgetPosition } = useEditMode();

  const savedPos = layoutState[id] || { x: 0, y: 0 };

  return (
    <div
      style={{
        ...style,
        position: style.position || 'static',
        zIndex: style.zIndex || 1
      }}
      className={className}
    >
      {children}
    </div>
  );
}
