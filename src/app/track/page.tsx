import type { Metadata } from 'next';
import TrackClient from '@/components/TrackClient';
import { Suspense } from 'react';

// Per-track title/description/OpenGraph tags are injected at the edge by
// functions/track.js; drop the generic ones so React doesn't re-add them. The
// title too: React put the site's own title back while drawing the page, for
// half a second, and a search engine reading it then kept that one
export const metadata: Metadata = {
  title: null,
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
