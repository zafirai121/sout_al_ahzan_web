"use client";

import React from 'react';

interface CreditsModalProps {
  track: any;
  onClose: () => void;
}

export default function CreditsModal({ track, onClose }: CreditsModalProps) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        direction: 'rtl'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#282828',
          borderRadius: '8px',
          width: '450px',
          maxWidth: '90%',
          padding: '24px',
          color: '#fff',
          position: 'relative',
          boxShadow: '0 16px 24px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            background: 'transparent',
            border: 'none',
            color: '#b3b3b3',
            cursor: 'pointer',
            padding: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.414 1.414a1 1 0 0 1 1.414 0L8 6.586l5.172-5.172a1 1 0 1 1 1.414 1.414L9.414 8l5.172 5.172a1 1 0 1 1-1.414 1.414L8 9.414l-5.172 5.172a1 1 0 0 1-1.414-1.414L6.586 8 1.414 2.828a1 1 0 0 1 0-1.414z"></path>
          </svg>
        </button>

        {/* Header */}
        <div style={{ marginBottom: '32px', paddingLeft: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>لائحة الشكر</h2>
          <p style={{ fontSize: '14px', color: '#b3b3b3', margin: 0 }}>{track?.title}</p>
        </div>

        {/* Artist Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>فنان</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>{track?.artist}</div>
              <div style={{ fontSize: '13px', color: '#b3b3b3' }}>فنان رئيسي</div>
            </div>
            <button 
              style={{
                background: 'transparent',
                border: '1px solid #727272',
                borderRadius: '32px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '6px 16px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.1s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#727272';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              متابعة
            </button>
          </div>
        </div>

        {/* Composition & Lyrics */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>التأليف والكلمات</h3>
          <div>
            <div style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>غير متوفر</div>
            <div style={{ fontSize: '13px', color: '#b3b3b3' }}>ملحن • مؤلف الكلمات</div>
          </div>
        </div>

        {/* Source */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>المصادر</h3>
          <div style={{ fontSize: '15px', color: '#fff' }}>صوت الأحزان</div>
        </div>

        {/* Report Error */}
        <div>
          <button 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b3b3b3',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
          >
            <span>الإبلاغ عن خطأ</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 2v1.5h-5.44l7.197 7.197-1.06 1.06L4.5 4.561V10H3V2h8z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
