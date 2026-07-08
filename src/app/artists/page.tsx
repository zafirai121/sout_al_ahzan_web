import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'للروايد والمنشدين | صوت الأحزان',
  description: 'أوصل صوتك وقصائدك للملايين من المستمعين حول العالم. منصة صوت الأحزان توفر لك الأدوات لإدارة أعمالك بفعالية.',
};

export default function ArtistsPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>أوصل صوتك للعالم</h1>
      <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '18px', marginBottom: '48px', lineHeight: '1.8' }}>
        سواء كنت رادوداً مبتدئاً أو محترفاً، منصة صوت الأحزان هي بوابتك للوصول إلى ملايين المستمعين المتشوقين للإبداع الحسيني والروحي.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
        <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>إحصائيات دقيقة</h3>
          <p style={{ color: '#b3b3b3', lineHeight: '1.6' }}>تعرف على من يستمع إليك، ومتى، ومن أي بلد. وفرنا لك لوحة تحكم متقدمة لمتابعة نمو جمهورك بشكل يومي.</p>
        </div>
        <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>تحكم كامل</h3>
          <p style={{ color: '#b3b3b3', lineHeight: '1.6' }}>قم برفع إصداراتك الجديدة، تحديث صورتك الشخصية، وإدارة صفحتك بالكامل بضغطة زر وبدون وسطاء.</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '40px', border: '1px solid #333', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>هل أنت مستعد لنشر إبداعك؟</h2>
        <button style={{ padding: '16px 40px', backgroundColor: '#F05B28', color: '#fff', borderRadius: '32px', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer', marginTop: '16px' }}>
          تأكيد صفحة الرادود الخاصة بك
        </button>
      </div>
    </div>
  );
}
