import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AudioLines, Ban, Library, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { InfoCard, InfoCta, InfoHero, InfoPage, InfoSection } from '@/components/info/Info';
import { nounAfter, RECITERS, TRACKS } from '@/utils/plural';

export const metadata: Metadata = {
  title: 'من نحن | صوت الأحزان',
  description: 'تعرف على قصة تأسيس منصة صوت الأحزان ورؤيتنا في نشر الوعي الحسيني وتوفير أفضل تجربة استماع للقصائد واللطميات الحسينية.',
};

// The library's size, counted when the site is built
async function librarySize() {
  try {
    const [tracks, reciters] = await Promise.all([
      supabase.from('audio_library').select('id', { count: 'exact', head: true }),
      supabase.from('reciters').select('id', { count: 'exact', head: true }).neq('name', 'مجهول'),
    ]);
    return { tracks: tracks.count ?? 0, reciters: reciters.count ?? 0 };
  } catch {
    return { tracks: 0, reciters: 0 };
  }
}

export default async function AboutPage() {
  const { tracks, reciters } = await librarySize();
  return (
    <InfoPage>
      <InfoHero
        title="عن صوت الأحزان"
        lead="منصة للاستماع إلى كل ما يخص الشعائر الحسينية: القصائد واللطميات، والمواليد، والأدعية، بأصوات الرواديد والمنشدين."
      />

      {tracks > 0 ? (
        <div className="info-stats">
          <div className="info-stat"><span className="info-stat-number">{tracks}</span><span className="info-stat-label">{nounAfter(tracks, TRACKS)} في المكتبة</span></div>
          <div className="info-stat"><span className="info-stat-number">{reciters}</span><span className="info-stat-label">{nounAfter(reciters, RECITERS)} على المنصة</span></div>
          <div className="info-stat"><span className="info-stat-number">9</span><span className="info-stat-label">أقسام، من القصائد إلى الزيارات</span></div>
        </div>
      ) : null}

      <InfoSection title="رسالتنا ورؤيتنا">
        <div className="info-panel info-prose">
          <p>
            منصة &quot;صوت الأحزان&quot; هي الملاذ الأول للاستماع المباشر وبجودة فائقة لكل ما يخص الشعائر الحسينية. نحن نؤمن بأن الكلمة الصادقة واللحن الشجي يتركان أثراً عميقاً في القلوب، لذلك حرصنا على توفير مكتبة ضخمة تضم آلاف القصائد واللطميات، والأدعية، والمواليد.
          </p>
          <p>
            رؤيتنا هي أن نكون الجسر الذي يربط محبي أهل البيت (عليهم السلام) بأصوات الرواديد والمنشدين من مختلف أنحاء العالم، في منصة عصرية تحترم خصوصيتهم وتوفر لهم أفضل تجربة مستخدم بدون انقطاع أو إعلانات مزعجة.
          </p>
        </div>
      </InfoSection>

      <InfoSection title="ما الذي نقدمه">
        <div className="info-grid">
          <InfoCard icon={<Library size={22} />} title="مكتبة شاملة">
            مجموعة واسعة من التصنيفات تلبي جميع الأذواق والمناسبات الدينية طوال العام.
          </InfoCard>
          <InfoCard icon={<AudioLines size={22} />} title="جودة استثنائية">
            نحرص على توفير أفضل جودة صوتية ممكنة لتعيش اللحظة بكل تفاصيلها.
          </InfoCard>
          <InfoCard icon={<Ban size={22} />} title="بلا إعلانات">
            لا إعلان يقطع قصيدة أو دعاء: الاستماع هنا تجربة روحية خالصة.
          </InfoCard>
          <InfoCard icon={<Smartphone size={22} />} title="على كل أجهزتك" href="/download" action="تطبيق الهاتف">
            على هذا الموقع، وفي تطبيق الهاتف لأندرويد وتطبيق الويب.
          </InfoCard>
        </div>
      </InfoSection>

      <InfoCta title="ابدأ الاستماع، أو اكتب لنا">
        <Link href="/" prefetch={false} className="btn-gold">الصفحة الرئيسية</Link>
        <Link href="/contact" prefetch={false} className="btn-outline">اتصل بنا</Link>
      </InfoCta>
    </InfoPage>
  );
}
