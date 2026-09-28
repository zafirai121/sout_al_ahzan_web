"use client";

import React from 'react';
import { Smartphone } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div style={{ padding: '80px 40px', color: '#fff', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '24px' }}>استمع أينما كنت. بحرية.</h1>
      <p style={{ fontSize: '20px', color: '#b3b3b3', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>افتح تطبيق صوت الأحزان على هاتفك واستمتع بأفضل تجربة استماع لقصائدك المفضلة.</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Mobile Download */}
        <div style={{ width: '280px', backgroundColor: '#282828', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Smartphone size={64} color="#fff" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>للهواتف الذكية</h2>
          <p style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 0 24px 0' }}>يعمل على Android و iPhone</p>
          <a href="https://zafirai121.github.io/sawt-alahzan-app/" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 32px', borderRadius: '24px', border: '1px solid #727272', background: 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', textDecoration: 'none' }}>افتح التطبيق</a>
        </div>

      </div>
    </div>
  );
}
