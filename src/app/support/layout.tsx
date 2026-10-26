import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الدعم الفني | صوت الأحزان',
  description: 'فريق الدعم الفني لمنصة صوت الأحزان، والأسئلة الشائعة عن الحساب والتشغيل والتنزيل.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
