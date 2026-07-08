import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المساعدة والدعم | صوت الأحزان',
  description: 'مركز المساعدة لمنصة صوت الأحزان. ابحث عن إجابات لأسئلتك وتعلم كيف تستخدم المنصة بكفاءة.',
};

export default function HelpPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>كيف يمكننا مساعدتك؟</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
        <input 
          type="text" 
          placeholder="ابحث عن مشكلة (مثال: نسيت كلمة المرور، لا يوجد صوت...)" 
          style={{ width: '100%', maxWidth: '600px', padding: '16px 24px', borderRadius: '32px', border: 'none', outline: 'none', fontSize: '18px', backgroundColor: '#282828', color: '#fff' }} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <a href="/support" style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', textDecoration: 'none', color: '#fff', transition: '0.2s' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>الحساب وتسجيل الدخول</h3>
          <p style={{ color: '#b3b3b3', margin: 0 }}>مساعدة في إدارة حسابك وكلمة المرور.</p>
        </a>
        <a href="/support" style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', textDecoration: 'none', color: '#fff', transition: '0.2s' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>مشاكل التشغيل والصوت</h3>
          <p style={{ color: '#b3b3b3', margin: 0 }}>حلول لمشاكل التقطيع أو عدم عمل المشغل.</p>
        </a>
        <a href="/support" style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', textDecoration: 'none', color: '#fff', transition: '0.2s' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>الاشتراكات والمدفوعات</h3>
          <p style={{ color: '#b3b3b3', margin: 0 }}>كل ما يخص الاشتراك في النسخة المميزة.</p>
        </a>
        <a href="/contact" style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', textDecoration: 'none', color: '#fff', transition: '0.2s' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>تواصل مع خدمة العملاء</h3>
          <p style={{ color: '#b3b3b3', margin: 0 }}>فريقنا جاهز للرد على استفساراتك مباشرة.</p>
        </a>
      </div>
    </div>
  );
}
