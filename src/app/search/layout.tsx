import type { Metadata } from 'next';

// Search results are lists of other pages: search engines should follow their
// links, not show the lists themselves.
export const metadata: Metadata = {
  title: 'البحث | صوت الأحزان',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
