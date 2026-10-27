"use client";

import { useEffect } from 'react';

/**
 * The tab's title for a page whose title depends on what it shows (a
 * playlist's name, a station's reciter). The router sets the route's own
 * title as it arrives, after this page's effects: set again a moment later,
 * so this one stays.
 */
export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;
    const full = `${title} | صوت الأحزان`;
    document.title = full;
    const again = window.setTimeout(() => { document.title = full; }, 50);
    return () => window.clearTimeout(again);
  }, [title]);
}
