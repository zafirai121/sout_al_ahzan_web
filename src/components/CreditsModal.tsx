"use client";

import React from 'react';
import { ArrowUpRight, X } from 'lucide-react';

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
          <X size={16} />
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
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
