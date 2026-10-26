"use client";

import React from 'react';
import { Ban, Disc3, Headphones } from 'lucide-react';
import { InfoCard, InfoHero, InfoPage, MessageForm } from '@/components/info/Info';

export default function ArtistsPage() {
  return (
    <InfoPage>
      <InfoHero
        kicker="للرواديد والمنشدين"
        title="انضم إلينا"
        lead="أوصل صوتك إلى ملايين المستمعين حول العالم. منصة صوت الأحزان هي الوجهة الأولى للاستماع الحسيني."
      />

      <div className="info-grid">
        <InfoCard icon={<Disc3 size={22} />} title="صفحة باسمك">
          تجمع كل قصائدك وإصداراتك الموسمية في مكان واحد، يجدها المستمع بالبحث عن اسمك.
        </InfoCard>
        <InfoCard icon={<Headphones size={22} />} title="على الموقع والهاتف">
          تُسمع أعمالك على هذا الموقع، وفي تطبيق صوت الأحزان على الهاتف.
        </InfoCard>
        <InfoCard icon={<Ban size={22} />} title="بلا إعلانات">
          لا إعلان يقطع قصيدتك على مستمعيها.
        </InfoCard>
      </div>

      <MessageForm
        kind="artist"
        title="طلب الانضمام كمنشد أو رادود"
        nameLabel="الاسم الكامل أو الفني"
        required={[]}
        labels={{ message: 'روابط لأعمالك السابقة أو قنواتك على يوتيوب وغيرها' }}
        submitLabel="إرسال طلب الانضمام"
        sentText="تم استلام طلبك بنجاح! سيقوم فريقنا بمراجعته والتواصل معك قريباً."
      />
    </InfoPage>
  );
}
