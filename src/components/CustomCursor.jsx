import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeEditor } from '../context/ThemeContext';

export default function CustomCursor() {
  const { cursorStyle } = useThemeEditor();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (cursorStyle === 'default') return;

    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'input' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('interactive')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorStyle]);

  if (cursorStyle === 'default') return null;

  const isRing = cursorStyle === 'ring';
  
  const size = isHovering ? (isRing ? 64 : 48) : (isRing ? 32 : 16);
  const offset = size / 2;

  return (
    <motion.div
      className="custom-cursor"
      animate={{
        x: mousePosition.x - offset,
        y: mousePosition.y - offset,
        scale: isHovering ? 1.5 : 1,
        backgroundColor: isRing ? 'transparent' : (isHovering ? 'var(--accent-green)' : 'var(--text-color)'),
        borderColor: isHovering ? 'var(--accent-green)' : 'var(--text-color)',
        opacity: isHovering ? 0.8 : 1,
      }}
      transition={{
        type: 'tween',
        ease: 'backOut',
        duration: 0.15,
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 999999,
        border: isRing ? '2px solid' : 'none',
        mixBlendMode: 'difference',
      }}
    />
  );
}
