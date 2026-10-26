import React from 'react';
import type { Metadata } from 'next';
import { InfoHero, InfoPage, LegalDoc } from '@/components/info/Info';

export const metadata: Metadata = {
  title: 'ملفات تعريف الارتباط | صوت الأحزان',
  description: 'كيف تستخدم منصة صوت الأحزان ملفات تعريف الارتباط (Cookies) لتحسين تجربتك.',
};

export default function CookiesPage() {
  return (
    <InfoPage wide>
      <InfoHero title="ملفات تعريف الارتباط" lead="ما الذي يحفظه الموقع في متصفحك، ولماذا، وكيف تتحكم فيه." />
      <LegalDoc
        updated="8 يوليو 2026"
        sections={[
          {
            id: 'what',
            title: 'ما هي ملفات تعريف الارتباط؟',
            body: <p>هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارتك لموقعنا. تساعدنا هذه الملفات على تذكر تفضيلاتك وتوفير تجربة استماع سلسة ومخصصة.</p>,
          },
          {
            id: 'how',
            title: 'كيف نستخدمها؟',
            body: (
              <ul>
                <li><strong>الضرورية:</strong> لحفظ حالة تسجيل الدخول الخاصة بك والحفاظ على أمان حسابك.</li>
                <li><strong>الوظيفية:</strong> لتذكر تفضيلات الواجهة مثل الوضع الليلي ومستوى الصوت المفضل.</li>
                <li><strong>التحليلية:</strong> لمعرفة الصفحات الأكثر زيارة والمقاطع الأكثر استماعاً لتحسين المنصة (مجهولة الهوية).</li>
              </ul>
            ),
          },
          {
            id: 'manage',
            title: 'إدارة الإعدادات',
            body: <p>يمكنك في أي وقت مسح ملفات تعريف الارتباط من متصفحك أو إيقافها، ولكن قد يؤثر ذلك على عمل بعض الميزات في المنصة مثل البقاء متصلاً.</p>,
          },
        ]}
      />
    </InfoPage>
  );
}
