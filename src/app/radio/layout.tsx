import type { Metadata } from 'next';

// The page itself runs in the browser; its title and description come from here
export const metadata: Metadata = {
  title: 'الراديو | صوت الأحزان',
  description: 'محطات صوت الأحزان: مقاطع رادودك المفضّل بلا توقف، مختارة عشوائياً في كل مرة.',
};

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
