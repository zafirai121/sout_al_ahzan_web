import type { Metadata } from 'next';
import TrackClient from '@/components/TrackClient';
import { Suspense } from 'react';

// Per-track description/OpenGraph tags are injected at the edge by
// functions/track.js; drop the generic ones so React doesn't re-add them.
export const metadata: Metadata = {
  description: null,
  openGraph: null,
  twitter: null,
};

export default async function TrackPage() {
  return (
    // data-seo-slot: functions/track.js puts the page's own words here for search
    // engines; the client component (drawn in the browser) replaces them
    <Suspense fallback={
      <div className="content-inner" data-seo-slot="track" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>جاري التحميل...</h2>
      </div>
    }>
      <TrackClient />
    </Suspense>
  );
}
