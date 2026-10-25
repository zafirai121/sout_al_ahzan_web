import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة | صوت الأحزان',
  robots: { index: false },
};

// Any address the site doesn't have, in Arabic and in the site's own look
// (the default was Next.js's English "404: This page could not be found.")
export default function NotFound() {
  return (
    <div className="not-found-page">
      <p className="not-found-code" aria-hidden="true">404</p>
      <h1>هذه الصفحة غير موجودة</h1>
      <p className="not-found-text">ربما تغيّر عنوانها أو حُذفت. ابحث عن القصيدة أو الرادود، أو عد إلى الرئيسية.</p>
      <div className="not-found-actions">
        <Link href="/" className="btn-gold"><Home size={18} aria-hidden="true" /> الرئيسية</Link>
        <Link href="/search" className="btn-outline"><Search size={18} aria-hidden="true" /> البحث</Link>
      </div>
    </div>
  );
}
