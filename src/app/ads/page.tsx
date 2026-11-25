import React from 'react';
import type { Metadata } from 'next';
import { InfoHero, InfoPage, LegalDoc } from '@/components/info/Info';

export const metadata: Metadata = {
  title: 'حول الإعلانات | صوت الأحزان',
  description: 'سياسة منصة صوت الأحزان تجاه الإعلانات: لا توجد إعلانات مفعّلة حالياً، وقد تُضاف مستقبلاً.',
};

export default function AdsPage() {
  return (
    <InfoPage wide>
      <InfoHero
        title="حول الإعلانات"
        lead="لا توجد إعلانات مفعّلة حالياً، وقد تُضاف مستقبلاً. ونؤمن بأن الاستماع للقصائد واللطميات الحسينية تجربة روحية خالصة، لذلك نرفض قطعياً مقاطعتها بأي إعلانات صوتية مزعجة أثناء تشغيل المقاطع."
      />
      <LegalDoc
        updated="24 نوفمبر 2026"
        sections={[
          {
            id: 'now',
            title: 'الوضع الحالي',
            body: <p>لا توجد إعلانات مفعّلة حالياً، وقد تُضاف مستقبلاً.</p>,
          },
          {
            id: 'audio',
            title: 'تجربة خالية من الإعلانات الصوتية',
            body: <p>لا يُقطع أي مقطع بإعلان صوتي، لا في بدايته ولا في أثنائه ولا بين مقطع وآخر.</p>,
          },
        ]}
      />
    </InfoPage>
  );
}
