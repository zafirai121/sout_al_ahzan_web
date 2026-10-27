import type { Metadata } from 'next';

// The page itself runs in the browser; its title and description come from here.
// What it shows is the visitor's own (or nothing before they sign in): not for
// search results, but its links are
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: 'رفع مقطع | صوت الأحزان',
  description: 'ارفع قصائدك وإصداراتك إلى صوت الأحزان.',
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
