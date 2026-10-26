import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'للرواديد والمنشدين | صوت الأحزان',
  description: 'انضم إلى منصة صوت الأحزان رادوداً أو منشداً، لتصل قصائدك إلى مستمعي المنصة.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
