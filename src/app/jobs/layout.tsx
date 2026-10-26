import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الوظائف | صوت الأحزان',
  description: 'انضم إلى فريق منصة صوت الأحزان: الوظائف المتاحة وطريقة التقديم.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
