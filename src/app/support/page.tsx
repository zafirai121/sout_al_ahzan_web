"use client";

import React from 'react';
import { InfoHero, InfoPage, InfoSection, MessageForm } from '@/components/info/Info';

const FAQS = [
  {
    q: 'كيف يمكنني إعادة تعيين كلمة المرور؟',
    a: "يمكنك إعادة تعيين كلمة المرور من خلال صفحة تسجيل الدخول بالضغط على 'نسيت كلمة المرور' واتباع التعليمات التي ستصلك عبر البريد.",
  },
  { q: 'هل المنصة مجانية؟', a: 'نعم، المنصة مجانية بالكامل وبدون إعلانات.' },
  {
    q: 'كيف يمكنني دعم المشروع؟',
    a: 'يمكنك دعم المشروع مادياً من خلال وسائل الدفع المتوفرة قريباً، أو معنوياً بمشاركة التطبيق مع أصدقائك والدعاء لنا.',
  },
  {
    q: 'هل يمكنني تشغيل المقاطع بدون إنترنت؟',
    a: 'نعم، يمكنك تنزيل المقاطع للاستماع إليها لاحقاً بدون الحاجة للاتصال بالإنترنت، من زر التنزيل في صفحة المقطع أو في المشغّل أسفل الصفحة.',
  },
];

export default function SupportPage() {
  return (
    <InfoPage>
      <InfoHero
        title="الدعم الفني"
        lead="نحن هنا لمساعدتك والإجابة على جميع استفساراتك المتعلقة باستخدام منصة صوت الأحزان."
      />

      <div className="info-split">
        <MessageForm
          kind="support"
          title="تواصل مع فريق الدعم الفني"
          labels={{ message: 'كيف يمكننا مساعدتك؟ اكتب تفاصيل المشكلة' }}
          submitLabel="إرسال طلب الدعم"
          sentText="تم إرسال رسالتك بنجاح! سيتم الرد عليك في أقرب وقت."
        />

        <InfoSection title="الأسئلة الشائعة">
          <div className="info-faq">
            {FAQS.map(f => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </InfoSection>
      </div>
    </InfoPage>
  );
}
