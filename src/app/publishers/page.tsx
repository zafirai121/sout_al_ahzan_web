"use client";

import React from 'react';
import { FolderUp, Mail } from 'lucide-react';
import { InfoCard, InfoHero, InfoPage, MessageForm } from '@/components/info/Info';

export default function PublishersPage() {
  return (
    <InfoPage>
      <InfoHero
        kicker="للناشرين وشركات الإنتاج"
        title="لوحة الناشرين"
        lead="أداة متقدمة مصممة خصيصاً لتسهيل رفع وتنظيم ونشر الإنتاجات الصوتية الحسينية."
      />

      <div className="info-grid">
        <InfoCard icon={<FolderUp size={22} />} title="رفع الإنتاجات ونشرها">
          ارفع إنتاجاتك الصوتية الحسينية لتصل إلى مستمعي المنصة على الموقع والهاتف.
        </InfoCard>
        <InfoCard icon={<Mail size={22} />} title="دعم مباشر">
          <a href="mailto:creators@soutalahzan.com" dir="ltr">creators@soutalahzan.com</a>
        </InfoCard>
      </div>

      <MessageForm
        kind="publisher"
        title="طلب الانضمام كناشر"
        nameLabel="اسم الجهة أو الناشر"
        emailLabel="البريد الإلكتروني الرسمي"
        required={[]}
        labels={{ message: 'روابط لأعمالك السابقة أو حساباتك على منصات أخرى (اختياري)' }}
        submitLabel="إرسال طلب الانضمام"
        sentText="تم استلام طلبك بنجاح! سيقوم فريقنا بمراجعته والتواصل معك قريباً."
      />
    </InfoPage>
  );
}
