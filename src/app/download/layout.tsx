import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تطبيق الهاتف | صوت الأحزان',
  description: 'نزّل تطبيق صوت الأحزان لأندرويد، أو افتح تطبيق الويب على أي هاتف.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
