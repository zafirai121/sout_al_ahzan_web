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
    // data-seo-slot: functions/reciter.js puts the page's own words here for search
    // engines; the client component (drawn in the browser) replaces them
    <Suspense fallback={
      <div className="content-inner" data-seo-slot="reciter" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>جاري التحميل...</h2>
      </div>
    }>
      <ReciterClient />
    </Suspense>
  );
}
