import type { Metadata } from 'next';

// The page itself runs in the browser; its title and description come from here
export const metadata: Metadata = {
  title: 'استكشف | صوت الأحزان',
  description: 'أحدث الإصدارات والأكثر استماعاً وكل رواديد صوت الأحزان.',
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
