"use client";

import Link from 'next/link';
import React from 'react';

// Cards navigate/play through onClick handlers, which search engines can't
// follow. CrawlLink puts a real <a href> on a card's title so Google can
// discover track and reciter pages, without changing what a click does:
//  - 'navigate': a normal link (stops the card's own onClick firing too)
//  - 'passive':  href is for crawlers only; a plain click keeps the card's
//                behaviour (e.g. playing the track)
export default function CrawlLink({
  href,
  children,
  mode = 'navigate',
}: {
  href: string;
  children: React.ReactNode;
  mode?: 'navigate' | 'passive';
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      style={{ color: 'inherit', textDecoration: 'none' }}
      onClick={e => {
        if (mode === 'passive') e.preventDefault();
        else e.stopPropagation();
      }}
    >
      {children}
    </Link>
  );
}
