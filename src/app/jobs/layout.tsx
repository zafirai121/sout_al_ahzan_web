import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الوظائف | صوت الأحزان',
  description: 'لا توجد وظائف متاحة حالياً في منصة صوت الأحزان.',
  // Closed for now (see page.tsx): kept out of search engines too
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
