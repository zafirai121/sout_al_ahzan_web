import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | صوت الأحزان',
  description: 'سياسة الخصوصية لمنصة صوت الأحزان توضح كيف نقوم بحماية وجمع واستخدام بيانات المستخدمين.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '32px', color: '#F05B28' }}>سياسة الخصوصية</h1>
      
      <div style={{ color: '#b3b3b3', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p>مرحباً بك في منصة "صوت الأحزان". توضح سياسة الخصوصية هذه التزامنا بحماية بياناتك الشخصية عند استخدامك لخدماتنا.</p>
        
        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>1. المعلومات التي نجمعها</h2>
          <p>نقوم بجمع المعلومات التي تقدمها طواعية عند إنشاء حساب (الاسم، البريد الإلكتروني)، بالإضافة إلى معلومات الاستخدام (سجل الاستماع، المفضلة، قوائم التشغيل) لتقديم تجربة مخصصة لك.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>2. كيف نستخدم معلوماتك</h2>
          <p>نستخدم بياناتك لتشغيل وتوفير الخدمات بشكل فعال، تحسين جودة التوصيات الصوتية، والتواصل معك بخصوص أي تحديثات أمنية أو تغييرات في الخدمة.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>3. مشاركة البيانات</h2>
          <p>نحن لا نقوم ببيع بياناتك الشخصية لأي جهة خارجية. قد نشارك بيانات غير محدِدة للهوية مع مزودي خدمات التحليل الإحصائي فقط بهدف تحسين أداء المنصة.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>4. حماية البيانات</h2>
          <p>نتخذ تدابير تقنية وأمنية متقدمة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو التدمير، بما في ذلك تشفير كلمات المرور والاتصال الآمن.</p>
        </section>
      </div>
      
      <p style={{ marginTop: '48px', fontSize: '14px', color: '#777' }}>آخر تحديث: 8 يوليو 2026</p>
    </div>
  );
}
