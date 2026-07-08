import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'حول الإعلانات | صوت الأحزان',
  description: 'سياسة منصة صوت الأحزان تجاه الإعلانات وكيفية المحافظة على تجربة استماع خالية من الإزعاج.',
};

export default function AdsPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '32px', color: '#F05B28' }}>حول الإعلانات</h1>
      
      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#1ed760' }}>تجربة خالية من الإعلانات الصوتية</h2>
        <p style={{ color: '#b3b3b3', fontSize: '18px' }}>
          نحن نؤمن بأن الاستماع للقصائد واللطميات الحسينية هي تجربة روحية خالصة، لذلك <strong>نرفض قطعياً</strong> مقاطعة هذه التجربة بأي إعلانات صوتية مزعجة أثناء تشغيل المقاطع.
        </p>
      </div>

      <div style={{ color: '#b3b3b3', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>الإعلانات المرئية (إن وجدت)</h2>
          <p>لضمان استمرارية المنصة المجانية، قد نقوم بعرض إعلانات مرئية (Banners) غير مزعجة في أماكن محددة من الموقع لا تؤثر على تصفحك للمحتوى. نحن نحرص على اختيار شبكات إعلانية تتوافق مع قيم ومبادئ المنصة.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>الباقة المميزة (Premium)</h2>
          <p>إذا كنت ترغب في دعم المنصة وإزالة حتى الإعلانات المرئية البسيطة، يمكنك دائماً الترقية إلى باقة "صوت الأحزان Premium" والتي تتيح لك أيضاً تحميل المقاطع للاستماع بدون إنترنت وميزات حصرية أخرى.</p>
        </section>
      </div>
      
      <p style={{ marginTop: '48px', fontSize: '14px', color: '#777' }}>آخر تحديث: 8 يوليو 2026</p>
    </div>
  );
}
