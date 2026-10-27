"use client";

// The newest tracks have their page in explore (with the rest of the
// browsing); this older address goes on to it.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecentPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/explore?type=recent');
  }, [router]);
  return <div className="content-inner" />;
}
