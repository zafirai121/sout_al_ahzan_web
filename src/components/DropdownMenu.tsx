"use client";

import React, { useState, useRef, useEffect } from 'react';

export type DropdownMenuItem = 
  | { type?: 'item'; label: string; onClick: () => void; icon?: React.ReactNode; rightIcon?: React.ReactNode; preventCloseOnClick?: boolean }
  | { type: 'divider' }
  | { type: 'custom'; content: React.ReactNode };

interface DropdownMenuProps {
  buttonContent: React.ReactNode;
  items: DropdownMenuItem[];
  style?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
}

export default function DropdownMenu({ buttonContent, items, style, menuStyle }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button 
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

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: '#282828',
          borderRadius: '4px',
          boxShadow: '0 16px 24px rgba(0,0,0,0.3)',
          minWidth: '220px',
          zIndex: 1000,
          padding: '4px 0',
          overflow: 'hidden',
          ...menuStyle
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
        </div>
      )}
    </div>
  );
}
