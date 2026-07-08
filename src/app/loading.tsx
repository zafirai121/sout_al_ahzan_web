import React from 'react';
import { CardSkeleton, HorizontalCardSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="content-inner">
      <div className="section-container" style={{ marginTop: '20px' }}>
        <h2 className="section-title" style={{ fontSize: '32px', marginBottom: '24px', opacity: 0.5 }}>جاري التحميل...</h2>
        
        <div className="cards-row" style={{ marginTop: '20px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <HorizontalCardSkeleton key={`horiz-skel-${i}`} />
          ))}
        </div>

        <div className="section-header" style={{ marginTop: '40px' }}>
          <h2> </h2>
        </div>
        <div className="cards-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={`card-skel-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
