import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soutalahzan.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/account/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
