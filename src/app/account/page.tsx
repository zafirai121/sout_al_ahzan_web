"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>نظرة عامة على الحساب</h1>
      
      <div style={{ backgroundColor: '#282828', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', margin: 0, borderBottom: '1px solid #3e3e3e', paddingBottom: '12px' }}>الملف الشخصي</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#b3b3b3' }}>البريد الإلكتروني</span>
          <span style={{ fontWeight: 'bold', direction: 'ltr' }}>{user?.email || 'غير مسجل'}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#b3b3b3' }}>تاريخ التسجيل</span>
          <span style={{ fontWeight: 'bold' }}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'غير متوفر'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#b3b3b3' }}>الخطة الحالية</span>
          <span style={{ fontWeight: 'bold', color: '#1ed760' }}>صوت الأحزان Free</span>
        </div>
      </div>
      
      <div style={{ marginTop: '32px', backgroundColor: '#282828', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>تسجيل الخروج من كل مكان</h2>
          <p style={{ margin: 0, color: '#b3b3b3', fontSize: '14px' }}>يؤدي هذا إلى تسجيل خروجك من كل الأجهزة التي تستخدمها لتسجيل الدخول.</p>
        </div>
        <button style={{ padding: '12px 24px', borderRadius: '24px', border: '1px solid #727272', backgroundColor: 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#727272'}>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
