import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-static';

// Written when the site is built, and served only when functions/sitemap.xml.js
// (which lists every track, live) can't reach the library: the same pages
const BASE = 'https://web.soutalahzan.com';
const BROWSE = ['/explore?type=recent', '/explore?type=popular', '/explore?type=reciters', '/radio'];
const CATEGORIES = ['hussainiya_poems', 'naei', 'muwalid', 'afrah', 'dua', 'ziyarat', 'quran', 'nasheed', 'lectures', 'variety'];
const ABOUT = ['/about', '/download', '/help', '/support', '/contact', '/artists', '/publishers', '/jobs', '/legal', '/privacy-policy', '/privacy-center', '/cookies', '/ads'];
const NOT_A_RECITER = 'مجهول';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let reciters: { id: number }[] = [];
  let tracks: { id: number }[] = [];

  try {
    const [{ data: rData }, { data: tData }] = await Promise.all([
      supabase.from('reciters').select('id').neq('name', NOT_A_RECITER).limit(1000),
      // The most listened first, up to a thousand (the live sitemap has them all)
      supabase.from('audio_library').select('id').order('listen_count', { ascending: false, nullsFirst: false }).limit(1000),
    ]);
    reciters = rData ?? [];
    tracks = tData ?? [];
  } catch (err) {
    console.error("Sitemap error:", err);
  }

  const now = new Date();
  const page = (path: string, changeFrequency: 'daily' | 'weekly' | 'monthly', priority: number) =>
    ({ url: `${BASE}${path}`, lastModified: now, changeFrequency, priority });

  return [
    page('', 'daily', 1),
    ...BROWSE.map(p => page(p, 'daily', 0.9)),
    ...CATEGORIES.map(id => page(`/category/${id}`, 'daily', 0.9)),
    ...reciters.map(r => page(`/reciter?id=${r.id}`, 'weekly', 0.8)),
    ...tracks.map(t => page(`/track?id=${t.id}`, 'monthly', 0.7)),
    ...ABOUT.map(p => page(p, 'monthly', 0.4)),
  ];
}
