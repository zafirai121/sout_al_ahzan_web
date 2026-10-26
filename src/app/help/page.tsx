"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { CircleUser, Headphones, Mic, MessageCircle, Smartphone, Upload } from 'lucide-react';
import { InfoCard, InfoCta, InfoHero, InfoPage } from '@/components/info/Info';
import { foldArabic } from '@/utils/categories';

const TOPICS = [
  { icon: <CircleUser size={22} />, title: 'الحساب وتسجيل الدخول', desc: 'مساعدة في إدارة حسابك وكلمة المرور.', href: '/support' },
  { icon: <Headphones size={22} />, title: 'مشاكل التشغيل والصوت', desc: 'حلول لمشاكل التقطيع أو عدم عمل المشغل.', href: '/support' },
  { icon: <Smartphone size={22} />, title: 'تطبيق الهاتف', desc: 'تنزيل تطبيق صوت الأحزان لأندرويد، أو فتح تطبيق الويب.', href: '/download' },
  { icon: <MessageCircle size={22} />, title: 'تواصل مع خدمة العملاء', desc: 'فريقنا جاهز للرد على استفساراتك مباشرة.', href: '/contact' },
  { icon: <Upload size={22} />, title: 'الناشرين وشركات الإنتاج', desc: 'تعرف على كيفية رفع المحتوى وإدارته.', href: '/publishers' },
  { icon: <Mic size={22} />, title: 'للرواديد والمنشدين', desc: 'انضم إلينا لتوثيق صفحتك ونشر قصائدك.', href: '/artists' },
];

export default function HelpPage() {
  const [query, setQuery] = useState('');
  // Spelling-tolerant: احمد finds أحمد, صفحه finds صفحة
  const words = foldArabic(query.trim()).split(/\s+/).filter(Boolean);
  const shown = TOPICS.filter(t => words.every(w => foldArabic(`${t.title} ${t.desc}`).includes(w)));

  return (
    <InfoPage>
      <InfoHero title="كيف يمكننا مساعدتك؟">
        <input
          type="search"
          className="info-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث عن موضوع (مثال: حساب، تشغيل، تطبيق…)"
          aria-label="ابحث في مواضيع المساعدة"
        />
      </InfoHero>

      {shown.length > 0 ? (
        <div className="info-grid">
          {shown.map(t => (
            <InfoCard key={t.title} icon={t.icon} title={t.title} href={t.href} action="افتح">
              {t.desc}
            </InfoCard>
          ))}
        </div>
      ) : (
        <p className="info-empty" role="status">
          لا توجد نتائج مطابقة لبحثك. يرجى <Link href="/contact" prefetch={false}>التواصل مع خدمة العملاء</Link> لمساعدتك.
        </p>
      )}

      <InfoCta title="لم تجد ما تبحث عنه؟">
        <Link href="/support" prefetch={false} className="btn-gold">الدعم الفني</Link>
        <Link href="/contact" prefetch={false} className="btn-outline">اتصل بنا</Link>
      </InfoCta>
    </InfoPage>
  );
}
