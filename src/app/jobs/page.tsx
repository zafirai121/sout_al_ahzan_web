import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الوظائف | صوت الأحزان',
  description: 'انضم إلى فريق عمل منصة صوت الأحزان وساهم في تطوير أكبر مكتبة صوتية إسلامية.',
};

export default function JobsPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>انضم لفريقنا</h1>
      <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '18px', marginBottom: '48px', lineHeight: '1.8' }}>
        نحن نبحث دائماً عن المبدعين والمبرمجين ومهندسي الصوت الشغوفين للمساهمة في بناء أفضل تجربة استماع لملايين المستخدمين حول العالم.
      </p>

      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>لا توجد شواغر حالياً</h2>
        <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '32px' }}>
          على الرغم من عدم وجود وظائف شاغرة في الوقت الحالي، إلا أننا نرحب دائماً بالسير الذاتية لأصحاب المواهب.
        </p>
        <button style={{ padding: '16px 32px', backgroundColor: '#fff', color: '#000', borderRadius: '32px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer' }}>
          أرسل سيرتك الذاتية
        </button>
      </div>
    </div>
  );
}
