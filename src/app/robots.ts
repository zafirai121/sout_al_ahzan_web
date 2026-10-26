import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/settings', '/account', '/profile'],
    },
    sitemap: 'https://web.soutalahzan.com/sitemap.xml',
  };
}
