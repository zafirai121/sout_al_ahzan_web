// The words a track's and a reciter's page carry in their HTML for search
// engines (functions/track.js, functions/reciter.js). The library has no
// lyrics, so a track page says what only that track has (its release, year,
// the day it was added) and links to what is around it: its release, the
// reciter's tracks added just before and after it, and their best known. Pages
// of one reciter then differ from each other, and every track is linked from
// its neighbours, not only from the sitemap.
import { escapeHtml } from './seo.js';

const H2 = 'style="font-size:22px;margin:24px 0 8px"';
const link = (t) => `<li><a href="/track?id=${t.id}">${escapeHtml(t.name)}</a></li>`;
const list = (tracks) => `<ul style="padding-inline-start:20px">${tracks.map(link).join('')}</ul>`;
const section = (title, tracks) => (tracks.length ? `<section><h2 ${H2}>${escapeHtml(title)}</h2>${list(tracks)}</section>` : '');

/** "4:05" as schema.org's duration ("PT4M5S"); null for an unknown length. */
export function isoDuration(value) {
  if (typeof value !== 'string' || !/^\d+(:\d{2}){1,2}$/.test(value)) return null;
  const parts = value.split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts];
  if (h + m + s === 0) return null;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}`;
}

/** A day as Arabic readers write it ("29 أكتوبر 2026"); '' when there is none. */
export function arabicDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

/** One sentence of what this track is: its reciter, category, release, occasion, year, place and the day it came. */
export function trackAbout({ name, artist, category, album, occasion, year, location, date }) {
  let about = `«${name}»`;
  if (category) about += `، من ${category}`;
  if (artist) about += `، بصوت ${artist}`;
  if (album) about += `، من إصدار «${album}»`;
  if (occasion) about += `، في ${occasion}`;
  if (year) about += `، سنة ${year}`;
  if (location) about += `، ${location}`;
  about += '.';
  if (date) about += ` أُضيف إلى المكتبة في ${date}.`;
  return about;
}

/** A track page's own HTML: where it sits, what it is, and the tracks around it. */
export function trackContent({ name, artist, reciterId, category, album, duration, about, release, before, after, popular }) {
  const reciter = artist ? (reciterId ? `<a href="/reciter?id=${reciterId}">${escapeHtml(artist)}</a>` : escapeHtml(artist)) : '';
  const facts = [reciter, escapeHtml(category || ''), album ? `إصدار «${escapeHtml(album)}»` : '', duration ? `<span dir="ltr">${escapeHtml(duration)}</span>` : '']
    .filter(Boolean).join(' • ');
  const trail = `<nav aria-label="مسار الصفحة" style="color:#b3b3b3;margin:0 0 12px"><a href="/">الرئيسية</a>${reciter ? ` › ${reciter}` : ''} › ${escapeHtml(name)}</nav>`;
  return (
    `<article dir="rtl">${trail}` +
    `<h1 style="font-size:32px;margin:0 0 8px">${escapeHtml(name)}</h1>` +
    (facts ? `<p style="color:#b3b3b3;margin:0 0 16px">${facts}</p>` : '') +
    `<p>${escapeHtml(about)}</p>` +
    (album ? section(`من إصدار «${album}»`, release) : '') +
    (artist && (before.length || after.length) ? section(`قبلها وبعدها في مكتبة ${artist}`, [...before, ...after]) : '') +
    (artist ? section(`الأكثر استماعاً لـ${artist}`, popular) : '') +
    `</article>`
  );
}

/** A reciter page's own HTML: every one of their tracks, release by release, the rest after them. */
export function reciterContent({ name, about, tracks }) {
  const releases = new Map();
  const rest = [];
  for (const t of tracks) {
    const album = (t.album || '').trim();
    if (!album) rest.push(t);
    else if (releases.has(album)) releases.get(album).push(t);
    else releases.set(album, [t]);
  }
  return (
    `<article dir="rtl">` +
    `<h1 style="font-size:32px;margin:0 0 8px">${escapeHtml(name)}</h1>` +
    `<p>${escapeHtml(about)}</p>` +
    [...releases].map(([album, list]) => section(`إصدار «${album}»`, list)).join('') +
    section(releases.size ? 'مقاطع أخرى' : `قصائد ${name}`, rest) +
    `</article>`
  );
}
