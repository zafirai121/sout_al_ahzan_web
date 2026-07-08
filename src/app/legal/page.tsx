import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الشروط والأحكام القانونية | صوت الأحزان',
  description: 'الشروط والأحكام القانونية الخاصة باستخدام منصة صوت الأحزان وحقوق الطبع والنشر.',
};

export default function LegalPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '32px', color: '#F05B28' }}>الشروط والأحكام القانونية</h1>
      
      <div style={{ color: '#b3b3b3', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>1. قبول الشروط</h2>
          <p>باستخدامك لمنصة "صوت الأحزان" أو أي من خدماتها وتطبيقاتها، فإنك توافق على الالتزام التام بجميع الشروط والأحكام الموضحة في هذه الصفحة. إذا كنت لا توافق على هذه الشروط، يُرجى التوقف عن استخدام المنصة.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>2. حقوق الملكية الفكرية</h2>
          <p>جميع المحتويات الصوتية المعروضة على المنصة هي ملك لأصحابها الشرعيين (الرواديد والمؤسسات الفنية). لا تدعي منصة "صوت الأحزان" امتلاك حقوق الطبع والنشر الأصلية للمقاطع ما لم يُذكر خلاف ذلك. يُمنع إعادة نشر أو استغلال المحتوى تجارياً بدون إذن.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>3. الاستخدام المقبول</h2>
          <p>تُمنح الحقوق للمستخدمين بالاستماع والاستخدام الشخصي فقط. يُمنع منعاً باتاً استخدام تقنيات السحب الآلي (Scraping) أو تحميل المحتوى لغرض إعادة بيعه أو توزيعه بطريقة تنتهك قوانين الخصوصية.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>4. إخلاء المسؤولية</h2>
          <p>يتم تقديم الخدمات "كما هي" دون أية ضمانات صريحة أو ضمنية. نحن لا نضمن استمرارية الخدمة خالية من الأخطاء أو التوقفات، ولكننا نبذل قصارى جهدنا لضمان استقرارها.</p>
        </section>
      </div>
      
      <p style={{ marginTop: '48px', fontSize: '14px', color: '#777' }}>آخر تحديث: 8 يوليو 2026</p>
    </div>
  );
}
