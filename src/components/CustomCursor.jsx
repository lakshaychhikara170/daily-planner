import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      // If target is interactive or has a specific class, grow the cursor
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
  }, []);

  return (
    <motion.div
      className="custom-cursor"
      animate={{
        x: mousePosition.x - (isHovering ? 24 : 8),
        y: mousePosition.y - (isHovering ? 24 : 8),
        scale: isHovering ? 1.5 : 1,
        backgroundColor: isHovering ? 'var(--accent-green)' : 'var(--text-color)',
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
        width: isHovering ? 48 : 16,
        height: isHovering ? 48 : 16,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 999999,
        mixBlendMode: 'difference',
      }}
    />
  );
}
