import type { Metadata } from 'next';
import { fetchHomeData } from '@/lib/home_data';
import HomeClient from '@/components/HomeClient';

export const revalidate = 3600; // Revalidate at most every hour (ISR)

const SITE_URL = 'https://web.soutalahzan.com';

// Homepage title/description carry the terms people actually search for
export const metadata: Metadata = {
  title: 'صوت الأحزان | لطميات وقصائد حسينية بصوت أشهر الرواديد',
  description: 'صوت الأحزان: أكبر مكتبة للطميات والقصائد الحسينية والنعي والمواليد والأدعية. استمع مجاناً وبدون إعلانات لباسم الكربلائي ومسلم الوائلي وأشهر الرواديد.',
  alternates: { canonical: SITE_URL },
};

// Tells Google this is the official "صوت الأحزان" site, its logo, and how to
// search it (can show a search box under the result)
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'صوت الأحزان',
    alternateName: ['Sout Al Ahzan', 'Soutalahzan'],
    url: SITE_URL,
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'صوت الأحزان',
    alternateName: 'Sout Al Ahzan',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-192.png`,
  },
];

export default async function Home() {
  // Fetched at build time; HomeClient refreshes it in the browser
  const { poems, popularPoems, reciters, fridayTracks } = await fetchHomeData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <HomeClient
        poems={poems}
        popularPoems={popularPoems}
        reciters={reciters}
        fridayTracks={fridayTracks}
      />
    </>
  );
}
