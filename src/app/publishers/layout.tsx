import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة الناشرين | صوت الأحزان',
  description: 'للناشرين وشركات الإنتاج: رفع الإنتاجات الصوتية الحسينية ونشرها على منصة صوت الأحزان.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
