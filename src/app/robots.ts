import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/premium', '/settings', '/account'],
    },
    sitemap: 'https://soutalahzan.com/sitemap.xml',
  };
}
