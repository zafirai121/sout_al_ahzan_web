import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'اتصل بنا | صوت الأحزان',
  description: 'نحن هنا للإجابة على استفساراتك. تواصل مع فريق دعم صوت الأحزان للحصول على المساعدة السريعة.',
};

export default function ContactPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>اتصل بنا</h1>
      <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '18px', marginBottom: '48px' }}>
        فريقنا متاح دائماً لسماع مقترحاتك، والإجابة على أسئلتك، وحل أي مشاكل فنية قد تواجهك.
      </p>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px', backgroundColor: '#181818', padding: '32px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>طرق التواصل المباشر</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <strong style={{ display: 'block', color: '#b3b3b3', marginBottom: '8px' }}>البريد الإلكتروني العام:</strong>
              <a href="mailto:info@soutalahzan.com" style={{ color: '#fff', fontSize: '18px', textDecoration: 'none' }}>info@soutalahzan.com</a>
            </div>
            <div>
              <strong style={{ display: 'block', color: '#b3b3b3', marginBottom: '8px' }}>دعم الناشرين والرواديد:</strong>
              <a href="mailto:creators@soutalahzan.com" style={{ color: '#fff', fontSize: '18px', textDecoration: 'none' }}>creators@soutalahzan.com</a>
            </div>
            <div>
              <strong style={{ display: 'block', color: '#b3b3b3', marginBottom: '8px' }}>الدعم الفني:</strong>
              <a href="/support" style={{ color: '#1ed760', fontSize: '18px', textDecoration: 'none' }}>انتقل لمركز الدعم</a>
            </div>
          </div>
        </div>

        <div style={{ flex: '1', minWidth: '300px', backgroundColor: '#181818', padding: '32px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>الشبكات الاجتماعية</h2>
          <p style={{ color: '#b3b3b3', marginBottom: '24px', lineHeight: '1.6' }}>
            يمكنك أيضاً التواصل معنا ومتابعة أحدث الإصدارات عبر قنواتنا الرسمية على منصات التواصل الاجتماعي.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#" style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold' }}>تويتر / X</a>
            <a href="#" style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold' }}>انستجرام</a>
            <a href="#" style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold' }}>تليجرام</a>
          </div>
        </div>
      </div>
    </div>
  );
}
