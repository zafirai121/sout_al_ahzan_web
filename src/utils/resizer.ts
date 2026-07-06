import React from 'react';

export const startResizing = (e: React.MouseEvent, side: 'right' | 'left') => {
  e.preventDefault();
  const startX = e.clientX;
  const isRight = side === 'right';
  
  const rsStr = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
  const csStr = getComputedStyle(document.documentElement).getPropertyValue('--context-sidebar-width');
  const initialWidth = parseInt(isRight ? rsStr : csStr) || 350;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - startX;
    // In RTL: right sidebar expands left (negative deltaX), left sidebar expands right (positive deltaX)
    let newWidth = initialWidth + (isRight ? -deltaX : deltaX);
    if (newWidth < 200) newWidth = 200;
    if (newWidth > 800) newWidth = 800;

    document.documentElement.style.setProperty(isRight ? '--sidebar-width' : '--context-sidebar-width', `${newWidth}px`);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};
