import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'اتصل بنا | صوت الأحزان',
  description: 'تواصل مع فريق منصة صوت الأحزان: أرسل رسالة، أو راسلنا على البريد الإلكتروني.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
