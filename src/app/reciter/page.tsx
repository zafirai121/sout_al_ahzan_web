import type { Metadata } from 'next';
import ReciterClient from '@/components/ReciterClient';
import { Suspense } from 'react';

// Per-reciter description/OpenGraph tags are injected at the edge by
// functions/reciter.js; drop the generic ones so React doesn't re-add them.
export const metadata: Metadata = {
  description: null,
  openGraph: null,
  twitter: null,
};

export default async function ReciterPage() {
  return (
    <Suspense fallback={
      <div className="content-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>جاري التحميل...</h2>
      </div>
    }>
      <ReciterClient />
    </Suspense>
  );
}
