import React from 'react';

// Each side panel's width, as the listener last left it in this browser
const VARIABLE = { right: '--sidebar-width', left: '--context-sidebar-width' } as const;
const KEPT = { right: 'soutalahzan_sidebar_width', left: 'soutalahzan_context_width' } as const;
const fits = (width: number) => width >= 200 && width <= 800;

export const startResizing = (e: React.MouseEvent, side: 'right' | 'left') => {
  e.preventDefault();
  const startX = e.clientX;
  const isRight = side === 'right';

  const initialWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue(VARIABLE[side])) || 350;
  let width = initialWidth;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - startX;
    // In RTL: right sidebar expands left (negative deltaX), left sidebar expands right (positive deltaX)
    let newWidth = initialWidth + (isRight ? -deltaX : deltaX);
    if (newWidth < 200) newWidth = 200;
    if (newWidth > 800) newWidth = 800;
    width = newWidth;

    document.documentElement.style.setProperty(VARIABLE[side], `${newWidth}px`);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    try {
      if (width !== initialWidth) localStorage.setItem(KEPT[side], String(width));
    } catch (e) {}
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

/** The widths the listener left the panels at, back after a reload */
export const restoreSizes = () => {
  for (const side of ['right', 'left'] as const) {
    try {
      const width = Number(localStorage.getItem(KEPT[side]));
      if (fits(width)) document.documentElement.style.setProperty(VARIABLE[side], `${width}px`);
    } catch (e) {}
  }
};
