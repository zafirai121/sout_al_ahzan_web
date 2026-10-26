import React from 'react';
import type { Metadata } from 'next';
import { Cookie, Megaphone, ShieldCheck, Trash2 } from 'lucide-react';
import { InfoCard, InfoHero, InfoPage } from '@/components/info/Info';

export const metadata: Metadata = {
  title: 'مركز الخصوصية | صوت الأحزان',
  description: 'تعرف على كيفية حماية منصة صوت الأحزان لبياناتك الشخصية وتعرف على حقوقك المتعلقة بالخصوصية.',
};

export default function PrivacyCenterPage() {
  return (
    <InfoPage>
      <InfoHero
        title="مركز الخصوصية"
        lead="خصوصيتك هي أولويتنا المطلقة. صممنا منصتنا لتمنحك التحكم الكامل في بياناتك ومعلوماتك."
      />
      <div className="info-grid">
        <InfoCard icon={<ShieldCheck size={22} />} title="سياسة الخصوصية" href="/privacy-policy" action="قراءة السياسة">
          اقرأ بالتفصيل كيف نجمع ونستخدم ونحمي بياناتك.
        </InfoCard>
        <InfoCard icon={<Trash2 size={22} />} title="حذف حسابك وبياناتك" href="/privacy-policy#delete-account" action="كيف تحذفه">
          احذف حسابك وكل ما يرتبط به في أي وقت، من التطبيق أو بالبريد.
        </InfoCard>
        <InfoCard icon={<Cookie size={22} />} title="ملفات تعريف الارتباط" href="/cookies" action="إدارة الإعدادات">
          ما الذي يحفظه الموقع في متصفحك، وكيف تتحكم فيه.
        </InfoCard>
        <InfoCard icon={<Megaphone size={22} />} title="البيانات والإعلانات" href="/ads" action="تعرف على المزيد">
          سياستنا تجاه الإعلانات، ولماذا لا يقطع إعلان أي مقطع.
        </InfoCard>
      </div>
    </InfoPage>
  );
}
