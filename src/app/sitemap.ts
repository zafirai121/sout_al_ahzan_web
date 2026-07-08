import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sout-al-ahzan-web.pages.dev';

  let reciters = [];
  let tracks = [];

  try {
    // Fetch top 100 reciters
    const { data: rData } = await supabase
      .from('reciters')
      .select('id')
      .limit(100);
    if (rData) reciters = rData;

    // Fetch top 500 tracks (most listened to prioritize SEO)
    const { data: tData } = await supabase
      .from('audio_library')
      .select('id')
      .order('listen_count', { ascending: false })
      .limit(500);
    if (tData) tracks = tData;
  } catch (err) {
    console.error("Sitemap error:", err);
  }

  const reciterUrls: MetadataRoute.Sitemap = reciters.map((r) => ({
    url: `${baseUrl}/reciter?id=${r.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const trackUrls: MetadataRoute.Sitemap = tracks.map((t) => ({
    url: `${baseUrl}/track?id=${t.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/recent`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...reciterUrls,
    ...trackUrls,
  ];
}
