import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'مركز الخصوصية | صوت الأحزان',
  description: 'تعرف على كيفية حماية منصة صوت الأحزان لبياناتك الشخصية وتعرف على حقوقك المتعلقة بالخصوصية.',
};

export default function PrivacyCenterPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', color: '#F05B28' }}>مركز الخصوصية</h1>
        <p style={{ color: '#b3b3b3', fontSize: '20px', lineHeight: '1.6' }}>
          خصوصيتك هي أولويتنا المطلقة. صممنا منصتنا لتمنحك التحكم الكامل في بياناتك ومعلوماتك.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>سياسة الخصوصية</h2>
            <p style={{ color: '#b3b3b3', margin: 0 }}>اقرأ بالتفصيل كيف نجمع ونستخدم ونحمي بياناتك.</p>
          </div>
          <Link href="/privacy-policy" style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold' }}>قراءة السياسة</Link>
        </div>

        <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>إعدادات ملفات الارتباط (Cookies)</h2>
            <p style={{ color: '#b3b3b3', margin: 0 }}>تحكم في البيانات التي نشاركها مع الأطراف الثالثة للتتبع والتطوير.</p>
          </div>
          <Link href="/cookies" style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold' }}>إدارة الإعدادات</Link>
        </div>

        <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>البيانات والإعلانات</h2>
            <p style={{ color: '#b3b3b3', margin: 0 }}>تعرف على كيفية تخصيص المحتوى لك بطريقة آمنة.</p>
          </div>
          <Link href="/ads" style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold' }}>تعرف على المزيد</Link>
        </div>
      </div>
    </div>
  );
}
