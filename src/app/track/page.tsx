import TrackClient from '@/components/TrackClient';
import { Suspense } from 'react';

export default async function TrackPage() {
  return (
    <Suspense fallback={
      <div className="content-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>جاري التحميل...</h2>
      </div>
    }>
      <TrackClient />
    </Suspense>
  );
}
