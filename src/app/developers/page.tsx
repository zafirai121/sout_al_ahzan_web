import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المطورين (API) | صوت الأحزان',
  description: 'اكتشف واجهات برمجة التطبيقات (API) الخاصة بصوت الأحزان لبناء تطبيقات جديدة مبتكرة.',
};

export default function DevelopersPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', color: '#F05B28' }}>بوابة المطورين</h1>
      <p style={{ color: '#b3b3b3', fontSize: '18px', marginBottom: '48px', lineHeight: '1.8' }}>
        استخدم واجهة برمجة التطبيقات (API) الخاصة بصوت الأحزان لجلب بيانات القصائد، الألبومات، وقوائم التشغيل مباشرة إلى تطبيقاتك وخدماتك.
      </p>

      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', fontFamily: 'monospace' }}>Sout Al-Ahzan Web API</h2>
        <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
          نحن نوفر RESTful API قوي مبني ليتوافق مع أحدث معايير المطورين. في الوقت الحالي، الـ API الخاص بنا في المرحلة التجريبية المغلقة (Closed Beta).
        </p>

        <div style={{ backgroundColor: '#000', padding: '24px', borderRadius: '8px', fontFamily: 'monospace', color: '#1ed760', marginBottom: '32px' }}>
          GET /v1/tracks?reciter_id=...<br/>
          Authorization: Bearer YOUR_TOKEN
        </div>

        <button style={{ padding: '16px 32px', backgroundColor: '#333', color: '#fff', borderRadius: '32px', fontWeight: 'bold', fontSize: '16px', border: '1px solid #555', cursor: 'pointer' }}>
          طلب وصول مبكر للـ API
        </button>
      </div>
    </div>
  );
}
