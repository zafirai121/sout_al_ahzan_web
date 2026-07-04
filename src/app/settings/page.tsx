"use client";

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [quality, setQuality] = useState('high');
  const [theme, setTheme] = useState('dark');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    // Load saved settings on mount
    const savedQuality = localStorage.getItem('sout_quality');
    if (savedQuality) setQuality(savedQuality);
    
    const savedTheme = localStorage.getItem('sout_theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const handleSave = () => {
    localStorage.setItem('sout_quality', quality);
    localStorage.setItem('sout_theme', theme);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div dir="rtl" style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '48px' }}>الإعدادات</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Playback Quality */}
        <div>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #3e3e3e', paddingBottom: '12px', marginBottom: '24px' }}>جودة الصوت</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <input type="radio" name="quality" value="auto" checked={quality === 'auto'} onChange={(e) => setQuality(e.target.value)} style={{ width: '20px', height: '20px', accentColor: '#1ed760' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>تلقائية</div>
                <div style={{ color: '#b3b3b3', fontSize: '14px', marginTop: '4px' }}>تتكيف مع سرعة اتصالك بالإنترنت</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <input type="radio" name="quality" value="high" checked={quality === 'high'} onChange={(e) => setQuality(e.target.value)} style={{ width: '20px', height: '20px', accentColor: '#1ed760' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>عالية (مقترحة)</div>
                <div style={{ color: '#b3b3b3', fontSize: '14px', marginTop: '4px' }}>أفضل جودة صوت متاحة للاستماع عبر الشبكة</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <input type="radio" name="quality" value="low" checked={quality === 'low'} onChange={(e) => setQuality(e.target.value)} style={{ width: '20px', height: '20px', accentColor: '#1ed760' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>منخفضة</div>
                <div style={{ color: '#b3b3b3', fontSize: '14px', marginTop: '4px' }}>لتوفير استهلاك البيانات أثناء التصفح</div>
              </div>
            </label>
          </div>
        </div>

        {/* Theme */}
        <div>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #3e3e3e', paddingBottom: '12px', marginBottom: '24px' }}>المظهر</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.value)} style={{ width: '20px', height: '20px', accentColor: '#1ed760' }} />
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>داكن (الوضع الافتراضي)</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', opacity: 0.5 }}>
              <input type="radio" name="theme" value="light" disabled style={{ width: '20px', height: '20px' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>فاتح</div>
                <div style={{ color: '#b3b3b3', fontSize: '14px', marginTop: '4px' }}>غير متاح حالياً - سيتم إضافته قريباً</div>
              </div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
          <button onClick={handleSave} style={{ padding: '14px 40px', borderRadius: '32px', border: 'none', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            حفظ التغييرات
          </button>
          
          {savedMessage && (
            <span style={{ color: '#1ed760', fontWeight: 'bold', animation: 'fadeIn 0.3s ease-in' }}>
              ✔️ تم حفظ الإعدادات بنجاح
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
