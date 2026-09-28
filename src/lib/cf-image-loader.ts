'use client'

import { resized } from '@/utils/image';

// next/image loader (see images.loaderFile in next.config.ts). `width` is
// already in real pixels (next/image accounts for screen density).
export default function cloudflareLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  return resized(src, width, quality || 75) ?? src;
}
