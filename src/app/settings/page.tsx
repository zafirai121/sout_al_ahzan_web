"use client";

import React, { useState } from 'react';

export default function SettingsPage() {
  const [quality, setQuality] = useState('high');
  const [theme, setTheme] = useState('dark');

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>الإعدادات</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Playback Quality */}
        <div>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #3e3e3e', paddingBottom: '8px', marginBottom: '16px' }}>جودة الصوت</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="radio" name="quality" value="auto" checked={quality === 'auto'} onChange={(e) => setQuality(e.target.value)} style={{ width: '18px', height: '18px' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>تلقائية</div>
                <div style={{ color: '#b3b3b3', fontSize: '12px' }}>تتكيف مع سرعة اتصالك بالإنترنت</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="radio" name="quality" value="high" checked={quality === 'high'} onChange={(e) => setQuality(e.target.value)} style={{ width: '18px', height: '18px' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>عالية (مقترحة)</div>
                <div style={{ color: '#b3b3b3', fontSize: '12px' }}>أفضل جودة صوت متاحة للاستماع عبر الشبكة</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="radio" name="quality" value="low" checked={quality === 'low'} onChange={(e) => setQuality(e.target.value)} style={{ width: '18px', height: '18px' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>منخفضة</div>
                <div style={{ color: '#b3b3b3', fontSize: '12px' }}>لتوفير استهلاك البيانات أثناء التصفح</div>
              </div>
            </label>
          </div>
        </div>

        {/* Theme */}
        <div>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #3e3e3e', paddingBottom: '8px', marginBottom: '16px' }}>المظهر</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.value)} style={{ width: '18px', height: '18px' }} />
              <div style={{ fontWeight: 'bold' }}>داكن (الوضع الافتراضي)</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', opacity: 0.5 }}>
              <input type="radio" name="theme" value="light" disabled style={{ width: '18px', height: '18px' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>فاتح</div>
                <div style={{ color: '#b3b3b3', fontSize: '12px' }}>غير متاح حالياً - سيتم إضافته قريباً</div>
              </div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={() => alert('تم حفظ الإعدادات بنجاح')} style={{ padding: '12px 32px', borderRadius: '24px', border: 'none', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            حفظ التغييرات
          </button>
        </div>

      </div>
    </div>
  );
}
