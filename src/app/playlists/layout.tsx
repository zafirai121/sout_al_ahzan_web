import type { Metadata } from 'next';

// The page itself runs in the browser; its title and description come from here
export const metadata: Metadata = {
  title: 'قوائم التشغيل | صوت الأحزان',
  description: 'قوائم التشغيل التي جمعتها في صوت الأحزان.',
};

export default function PlaylistsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
