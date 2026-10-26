import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المساعدة | صوت الأحزان',
  description: 'مركز المساعدة في منصة صوت الأحزان: الحساب، والتشغيل، وتطبيق الهاتف، والتواصل.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
