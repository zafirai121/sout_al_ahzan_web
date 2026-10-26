"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export type DropdownMenuItem =
  | { type?: 'item'; label: string; onClick: () => void; icon?: React.ReactNode; rightIcon?: React.ReactNode; preventCloseOnClick?: boolean }
  | { type: 'divider' }
  | { type: 'custom'; content: React.ReactNode };

interface DropdownMenuProps {
  buttonContent: React.ReactNode;
  items: DropdownMenuItem[];
  style?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  /** What screen readers announce for the (icon-only) button. */
  label?: string;
}

// Kept this far from the window's edges
const EDGE = 8;

export default function DropdownMenu({ buttonContent, items, style, menuStyle, label = 'خيارات' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // The menu is drawn over the whole page (in <body>), so a row that scrolls
  // sideways or a card that clips its picture can't cut it off. It opens under
  // the button, starting at its left edge; above it when there's no room below,
  // and moved in when it would leave the window.
  useLayoutEffect(() => {
    if (!isOpen) return setPlace(null);
    const button = menuRef.current?.getBoundingClientRect();
    const list = listRef.current;
    if (!button || !list) return;
    const { width, height } = list.getBoundingClientRect();
    const below = button.bottom + 8;
    const top = below + height <= window.innerHeight - EDGE ? below : Math.max(EDGE, button.top - 8 - height);
    const left = Math.min(Math.max(EDGE, button.left), window.innerWidth - EDGE - width);
    setPlace({ top, left });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !listRef.current?.contains(target)) close();
    };
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    // It stays where it opened, so it closes when what's under it moves
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {buttonContent}
      </button>

      {isOpen && createPortal(
        <div ref={listRef} role="menu" style={{
          backgroundColor: '#282828',
          borderRadius: '4px',
          boxShadow: '0 16px 24px rgba(0,0,0,0.3)',
          minWidth: '280px',
          padding: '4px 0',
          overflow: 'hidden',
          ...menuStyle,
          // Its place is worked out above, whatever menuStyle says
          position: 'fixed',
          top: place?.top ?? 0,
          left: place?.left ?? 0,
          right: 'auto',
          zIndex: 9000,
          // Measured first, out of sight, then put in its place
          visibility: place ? 'visible' : 'hidden',
        }}>
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={index} style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />;
            }
            if (item.type === 'custom') {
              return <div key={index}>{item.content}</div>;
            }

            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.preventCloseOnClick) {
                    setIsOpen(false);
                  }
                  item.onClick();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textAlign: 'right'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3E3E3E'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {item.icon && <span style={{ color: '#b3b3b3', display: 'flex' }}>{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {item.rightIcon && <span style={{ color: '#b3b3b3', display: 'flex' }}>{item.rightIcon}</span>}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
