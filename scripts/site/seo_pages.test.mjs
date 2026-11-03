import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arabicDate, isoDuration, reciterContent, trackAbout, trackContent } from '../../cloudflare/seo-pages.js';

test('durationAsSchemaWantsIt', () => {
  assert.equal(isoDuration('4:05'), 'PT4M5S');
  assert.equal(isoDuration('1:02:03'), 'PT1H2M3S');
  assert.equal(isoDuration('0:00'), null);
  assert.equal(isoDuration(''), null);
});

test('dateInArabicWithItsOwnDigits', () => {
  assert.equal(arabicDate('2026-10-29T03:35:14Z'), '29 أكتوبر 2026');
  assert.equal(arabicDate(null), '');
});

test('aboutSaysWhatOnlyThisTrackHas', () => {
  const about = trackAbout({ name: 'يوم الحرب', artist: 'محمد حجيرات', category: 'قصائد حسينية', album: 'عرس الشهادة', year: '1446', date: '29 أكتوبر 2026' });
  assert.match(about, /«يوم الحرب»/);
  assert.match(about, /محمد حجيرات/);
  assert.match(about, /إصدار «عرس الشهادة»/);
  assert.match(about, /1446/);
  assert.match(about, /29 أكتوبر 2026/);
  assert.doesNotMatch(trackAbout({ name: 'س', artist: 'ر' }), /إصدار|undefined|null/);
});

const page = {
  id: 10, name: 'يوم <الحرب>', artist: 'محمد حجيرات', reciterId: 254, category: 'قصائد حسينية', album: 'عرس الشهادة', duration: '4:05',
  about: 'نبذة',
  release: [{ id: 11, name: 'زينب' }],
  before: [{ id: 9, name: 'قبلها' }],
  after: [{ id: 12, name: 'بعدها' }],
  popular: [{ id: 3, name: 'الأشهر' }],
};

test('trackPageHasItsOwnNeighbours', () => {
  const html = trackContent(page);
  assert.match(html, /<h1[^>]*>يوم &lt;الحرب&gt;<\/h1>/);
  assert.match(html, /href="\/reciter\?id=254"/);
  assert.match(html, /من إصدار «عرس الشهادة»[\s\S]*href="\/track\?id=11"/);
  assert.match(html, /href="\/track\?id=9"[\s\S]*href="\/track\?id=12"/);
  assert.match(html, /href="\/track\?id=3"/);
});

test('noEmptySections', () => {
  const html = trackContent({ ...page, album: '', release: [], before: [], after: [], popular: [] });
  assert.doesNotMatch(html, /إصدار|قبلها وبعدها|الأكثر استماعاً/);
});

test('reciterPageListsEveryTrackByRelease', () => {
  const tracks = [
    { id: 1, name: 'أ', album: 'عرس الشهادة' },
    { id: 2, name: 'ب', album: '' },
    { id: 3, name: 'ج', album: 'عرس الشهادة' },
    { id: 4, name: 'د', album: 'هداك الله' },
  ];
  const html = reciterContent({ name: 'محمد حجيرات', about: 'نبذة', tracks });
  assert.match(html, /<h1[^>]*>محمد حجيرات<\/h1>/);
  assert.match(html, /إصدار «عرس الشهادة»[\s\S]*track\?id=1[\s\S]*track\?id=3/);
  assert.match(html, /إصدار «هداك الله»[\s\S]*track\?id=4/);
  assert.match(html, /مقاطع أخرى[\s\S]*track\?id=2/);
  assert.equal((html.match(/href="\/track\?id=/g) || []).length, 4);
});
