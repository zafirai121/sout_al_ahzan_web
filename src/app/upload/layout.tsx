import type { Metadata } from 'next';

// The page itself runs in the browser; its title and description come from here
export const metadata: Metadata = {
  title: 'رفع مقطع | صوت الأحزان',
  description: 'ارفع قصائدك وإصداراتك إلى صوت الأحزان.',
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
