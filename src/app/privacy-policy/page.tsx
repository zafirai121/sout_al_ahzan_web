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

        {/* رابط تعليمات حذف البيانات الذي تطلبه فيسبوك وGoogle: /privacy-policy#delete-account */}
        <section id="delete-account">
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>5. حذف حسابك وبياناتك</h2>
          <p>يمكنك حذف حسابك وكل بياناتك في أي وقت، سواء سجّلت الدخول بالبريد الإلكتروني أو بحساب Google أو فيسبوك:</p>
          <ul style={{ paddingInlineStart: '24px', margin: '12px 0' }}>
            <li><strong style={{ color: '#fff' }}>من التطبيق:</strong> افتح «الحساب» ثم «الإعدادات» ثم «معلومات الحساب»، واضغط «حذف الحساب». يُحذف الحساب فوراً.</li>
            <li><strong style={{ color: '#fff' }}>بالبريد الإلكتروني:</strong> راسلنا على <a href="mailto:support@soutalahzan.com" style={{ color: '#F05B28' }}>support@soutalahzan.com</a> من البريد المرتبط بحسابك، وسنحذفه ونؤكد لك ذلك بالرد.</li>
          </ul>
          <p>يُحذف مع الحساب: الاسم والبريد الإلكتروني وصورة الملف الشخصي، والمفضلة وقوائم التشغيل والمتابعات، والتعليقات والتقييمات. أما المقاطع التي رفعتها إلى المكتبة العامة فتبقى دون ربطها باسمك.</p>
          <p>إن سجّلت الدخول بفيسبوك أو Google، فيمكنك أيضاً إزالة صلاحية «صوت الأحزان» من إعدادات حسابك هناك.</p>
        </section>

        <section>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>6. تواصل معنا</h2>
          <p>لأي سؤال عن خصوصيتك راسلنا على <a href="mailto:support@soutalahzan.com" style={{ color: '#F05B28' }}>support@soutalahzan.com</a>.</p>
        </section>
      </div>
      
      <p style={{ marginTop: '48px', fontSize: '14px', color: '#777' }}>آخر تحديث: 1 أكتوبر 2026</p>
    </div>
  );
}
