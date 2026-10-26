import React from 'react';
import type { Metadata } from 'next';
import { InfoHero, InfoPage, LegalDoc } from '@/components/info/Info';

export const metadata: Metadata = {
  title: 'حول الإعلانات | صوت الأحزان',
  description: 'سياسة منصة صوت الأحزان تجاه الإعلانات وكيفية المحافظة على تجربة استماع خالية من الإزعاج.',
};

export default function AdsPage() {
  return (
    <InfoPage wide>
      <InfoHero
        title="حول الإعلانات"
        lead="نحن نؤمن بأن الاستماع للقصائد واللطميات الحسينية تجربة روحية خالصة، لذلك نرفض قطعياً مقاطعتها بأي إعلانات صوتية مزعجة أثناء تشغيل المقاطع."
      />
      <LegalDoc
        updated="8 يوليو 2026"
        sections={[
          {
            id: 'audio',
            title: 'تجربة خالية من الإعلانات الصوتية',
            body: <p>لا يُقطع أي مقطع بإعلان صوتي، لا في بدايته ولا في أثنائه ولا بين مقطع وآخر.</p>,
          },
          {
            id: 'visual',
            title: 'الإعلانات المرئية (إن وجدت)',
            body: <p>لضمان استمرارية المنصة المجانية، قد نقوم بعرض إعلانات مرئية (Banners) غير مزعجة في أماكن محددة من الموقع لا تؤثر على تصفحك للمحتوى. نحن نحرص على اختيار شبكات إعلانية تتوافق مع قيم ومبادئ المنصة.</p>,
          },
        ]}
      />
    </InfoPage>
  );
}
