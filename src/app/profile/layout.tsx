import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ملفك ومكتبتك | صوت الأحزان',
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
