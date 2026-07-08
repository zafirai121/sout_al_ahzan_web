import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة الناشرين | صوت الأحزان',
  description: 'بوابة الناشرين والمؤسسات الفنية لإدارة المحتوى الصوتي والحقوق الفكرية على منصة صوت الأحزان.',
};

export default function PublishersPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span style={{ padding: '8px 16px', backgroundColor: '#333', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: '#b3b3b3' }}>للمؤسسات والشركات الفنية</span>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginTop: '24px', marginBottom: '24px', color: '#F05B28' }}>لوحة الناشرين</h1>
        <p style={{ color: '#b3b3b3', fontSize: '18px', lineHeight: '1.8' }}>
          نظام متكامل صُمم خصيصاً للمؤسسات الفنية لإدارة الإنتاج الصوتي لعدة رواديد، وتتبع الأداء، وتنظيم الإصدارات الحصرية بفعالية وموثوقية عالية.
        </p>
      </div>

      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>الميزات الحصرية للناشرين</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <li style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#1ed760', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '18px' }}>إدارة حقوق الطبع والنشر للمحتوى</span>
          </li>
          <li style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#1ed760', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '18px' }}>نظام رفع دفعي (Batch Upload) للألبومات الضخمة</span>
          </li>
          <li style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#1ed760', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '18px' }}>تقارير استماع تفصيلية وتقسيمات جغرافية للجمهور</span>
          </li>
        </ul>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <a href="mailto:publishers@soutalahzan.com" style={{ padding: '16px 40px', backgroundColor: '#fff', color: '#000', borderRadius: '32px', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none' }}>
            تواصل معنا للإنضمام
          </a>
        </div>
      </div>
    </div>
  );
}
