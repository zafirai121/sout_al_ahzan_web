"use client";

import React from 'react';

export default function DownloadPage() {
  return (
    <div style={{ padding: '80px 40px', color: '#fff', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '24px' }}>استمع أينما كنت. بحرية.</h1>
      <p style={{ fontSize: '20px', color: '#b3b3b3', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>قم بتنزيل تطبيق صوت الأحزان على هاتفك أو حاسوبك واستمتع بأفضل تجربة استماع للقائمة الخاصة بك.</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Windows Download */}
        <div style={{ width: '280px', backgroundColor: '#282828', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#fff" style={{ marginBottom: '24px' }}><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>لأجهزة Windows</h2>
          <p style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 0 24px 0' }}>متوافق مع Windows 10 و 11</p>
          <button onClick={() => window.open('https://t.me/Zafir1199', '_blank')} style={{ padding: '12px 32px', borderRadius: '24px', border: 'none', background: '#1ed760', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>تنزيل عبر تيليجرام</button>
        </div>

        {/* Mac Download */}
        <div style={{ width: '280px', backgroundColor: '#282828', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#fff" style={{ marginBottom: '24px' }}><path d="M16.365 1.154c-1.396.067-2.915.938-3.864 1.947-.84.898-1.553 2.189-1.332 3.428 1.545.109 2.924-.761 3.829-1.785.795-.898 1.401-2.193 1.367-3.59zm-1.07 4.887c-3.136-.08-5.068 1.83-6.136 1.83-1.096 0-2.617-1.637-4.887-1.583-2.964.053-5.71 1.748-7.234 4.398-3.1 5.412-.782 13.432 2.215 17.8 1.488 2.164 3.226 4.606 5.6 4.5 2.274-.108 3.125-1.482 5.864-1.482 2.71 0 3.513 1.482 5.92 1.428 2.457-.054 3.967-2.27 5.4-4.348 1.66-2.428 2.34-4.78 2.368-4.9-.054-.027-4.57-1.758-4.624-7.009-.054-4.397 3.565-6.527 3.73-6.634-2.072-3.037-5.318-3.414-6.425-3.504z"/></svg>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>لأجهزة Mac</h2>
          <p style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 0 24px 0' }}>متوافق مع macOS 10.15+</p>
          <button onClick={() => window.open('https://t.me/Zafir1199', '_blank')} style={{ padding: '12px 32px', borderRadius: '24px', border: 'none', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>تنزيل عبر تيليجرام</button>
        </div>

        {/* Mobile Download */}
        <div style={{ width: '280px', backgroundColor: '#282828', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#fff" style={{ marginBottom: '24px' }}><path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16zM12 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>للهواتف الذكية</h2>
          <p style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 0 24px 0' }}>متاح على iOS و Android</p>
          <button onClick={() => window.open('https://t.me/Zafir1199', '_blank')} style={{ padding: '12px 32px', borderRadius: '24px', border: '1px solid #727272', background: 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>تنزيل عبر تيليجرام</button>
        </div>

      </div>
    </div>
  );
}
