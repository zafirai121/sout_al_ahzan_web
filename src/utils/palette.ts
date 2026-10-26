"use client";

// A picture's colours for the gradient behind it (the reciter's and the
// track's headers), read from a small copy of the picture:
// - every pixel is placed by its hue, in 24 slices of the colour wheel; the
//   near black, the near white and the greys are counted apart;
// - each slice weighs as much as the picture has of it, more for vivid colours,
//   so a red shrine wins over a few red pixels and a large grey wall doesn't win
//   over the face in front of it;
// - the heaviest slice is the main colour, the heaviest one far enough round
//   the wheel from it (45°) the second; a grey picture gets its own grey;
// - both are then brought to a lightness and saturation white words read on.

import { useEffect, useState } from 'react';
import { thumb } from '@/utils/image';

export type Palette = { main: string; accent: string };

type Slice = { weight: number; r: number; g: number; b: number; n: number };

const SLICES = 24;
const SIDE = 40; // the picture is read at 40 × 40

function hsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function css(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The main and second colours of an image's pixels (RGBA, as a canvas gives them) */
export function paletteOf(pixels: Uint8ClampedArray): Palette | null {
  const slices: Slice[] = Array.from({ length: SLICES }, () => ({ weight: 0, r: 0, g: 0, b: 0, n: 0 }));
  const grey: Slice = { weight: 0, r: 0, g: 0, b: 0, n: 0 };
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const [h, s, l] = hsl(r, g, b);
    if (l < 0.07 || l > 0.94) continue; // near black or white: says nothing of the colour
    const into = s < 0.16 ? grey : slices[Math.floor(h / (360 / SLICES)) % SLICES];
    // Vivid and mid-light counts more: that is what the eye takes as the picture's colour
    const weight = (0.35 + s) * (1 - Math.abs(l - 0.5));
    into.weight += weight;
    into.r += r * weight; into.g += g * weight; into.b += b * weight;
    into.n++;
  }
  const colourOf = (x: Slice) => hsl(x.r / x.weight, x.g / x.weight, x.b / x.weight);
  const ranked = slices.map((x, i) => ({ x, i })).filter(({ x }) => x.n > 0).sort((a, b) => b.x.weight - a.x.weight);
  const total = ranked.reduce((sum, { x }) => sum + x.weight, 0) + grey.weight;
  if (!total) return null;

  // Mostly grey (a black-and-white photo): its own grey, a little warmed
  if (!ranked.length || ranked[0].x.weight < grey.weight * 0.25) {
    const [, , l] = grey.weight ? colourOf(grey) : [0, 0, 0.3];
    return { main: css(36, 0.12, clamp(l, 0.2, 0.3)), accent: css(36, 0.08, 0.14) };
  }

  const [h1, s1, l1] = colourOf(ranked[0].x);
  const far = ranked.find(({ i }) => {
    const apart = Math.abs(i - ranked[0].i) * (360 / SLICES);
    return Math.min(apart, 360 - apart) >= 45;
  });
  const [h2, s2, l2] = far && far.x.weight > ranked[0].x.weight * 0.15 ? colourOf(far.x) : [h1, s1 * 0.8, l1 * 0.7];
  return {
    // Dark enough under white words, coloured enough to be the picture's
    main: css(h1, clamp(s1, 0.3, 0.62), clamp(l1, 0.24, 0.34)),
    accent: css(h2, clamp(s2, 0.25, 0.55), clamp(l2, 0.16, 0.26)),
  };
}

// Each picture is read once a visit
const known = new Map<string, Palette | null>();

/**
 * The palette of the picture at `url`, once read (null before, or when it
 * can't be: a picture from a site that doesn't allow reading it).
 */
export function usePalette(url: string | null | undefined): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(() => (url ? known.get(url) ?? null : null));
  useEffect(() => {
    if (!url) return setPalette(null);
    if (known.has(url)) return setPalette(known.get(url) ?? null);
    let live = true;
    const done = (found: Palette | null) => {
      known.set(url, found);
      if (live) setPalette(found);
    };
    // Its small copy first, the picture as stored if that won't do (Cloudflare's
    // resizing doesn't allow reading). Each asked for at an address of its own:
    // the same picture shown on the page is kept by the browser without leave
    // to read it, and would be handed back instead
    const own = (src: string) => `${src}${src.includes('?') ? '&' : '?'}palette`;
    const tries = [...new Set([thumb(url, 48), url].filter((s): s is string => !!s && !s.includes('/cdn-cgi/')))].map(own);
    const attempt = (i: number) => {
      if (i >= tries.length) return done(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = SIDE;
          canvas.height = SIDE;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return done(null);
          ctx.drawImage(img, 0, 0, SIDE, SIDE);
          done(paletteOf(ctx.getImageData(0, 0, SIDE, SIDE).data));
        } catch {
          attempt(i + 1); // read refused: the next address
        }
      };
      img.onerror = () => attempt(i + 1);
      img.src = tries[i];
    };
    attempt(0);
    return () => { live = false; };
  }, [url]);
  return palette;
}

/** The palette as the CSS custom properties the headers read (--hero-main, --hero-accent) */
export const paletteStyle = (p: Palette | null) =>
  (p ? { '--hero-main': p.main, '--hero-accent': p.accent } : {}) as React.CSSProperties;
