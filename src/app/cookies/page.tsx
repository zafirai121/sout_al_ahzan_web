import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ملفات تعريف الارتباط | صوت الأحزان',
  description: 'كيف تستخدم منصة صوت الأحزان ملفات تعريف الارتباط (Cookies) لتحسين تجربتك.',
};

export default function CookiesPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '32px', color: '#F05B28' }}>ملفات تعريف الارتباط (Cookies)</h1>
      
      <div style={{ color: '#b3b3b3', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>ما هي ملفات تعريف الارتباط؟</h2>
          <p>هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارتك لموقعنا. تساعدنا هذه الملفات على تذكر تفضيلاتك وتوفير تجربة استماع سلسة ومخصصة.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>كيف نستخدمها؟</h2>
          <ul style={{ paddingRight: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong>الضرورية:</strong> لحفظ حالة تسجيل الدخول الخاصة بك والحفاظ على أمان حسابك.</li>
            <li style={{ marginBottom: '8px' }}><strong>الوظيفية:</strong> لتذكر تفضيلات الواجهة مثل الوضع الليلي ومستوى الصوت المفضل.</li>
            <li style={{ marginBottom: '8px' }}><strong>التحليلية:</strong> لمعرفة الصفحات الأكثر زيارة والمقاطع الأكثر استماعاً لتحسين المنصة (مجهولة الهوية).</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>إدارة الإعدادات</h2>
          <p>يمكنك في أي وقت مسح ملفات تعريف الارتباط من متصفحك أو إيقافها، ولكن قد يؤثر ذلك على عمل بعض الميزات في المنصة مثل البقاء متصلاً.</p>
        </section>
      </div>
      
      <p style={{ marginTop: '48px', fontSize: '14px', color: '#777' }}>آخر تحديث: 8 يوليو 2026</p>
    </div>
  );
}
