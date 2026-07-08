import ReciterClient from '@/components/ReciterClient';
import { Suspense } from 'react';

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
