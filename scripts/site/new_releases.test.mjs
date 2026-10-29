import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newReleasesOf } from '../../src/lib/new_releases.ts';

const t = (id, reciter_id, reciter_name, album, image_url = `img${id}.jpg`) => ({ id, title: `t${id}`, reciter_id, reciter_name, album, image_url });

test('oneCardForEachReciter', () => {
  const tracks = [
    t(10, 254, 'محمد حجيرات', 'عرس الشهادة'),
    t(9, 254, 'محمد حجيرات', 'عرس الشهادة'),
    t(8, 254, 'محمد حجيرات', 'موايد وافراح'),
    t(7, 3, 'باسم الكربلائي', null),
    t(6, 254, 'محمد حجيرات', 'عرس الشهادة'),
    t(5, null, 'بلا صفحة', 'أ'),
  ];
  const cards = newReleasesOf(tracks);
  assert.deepEqual(cards.map(c => c.reciterId), ['254', '3']);
  // The newest track's release, its title and picture, and the page it opens on
  assert.equal(cards[0].name, 'محمد حجيرات');
  assert.equal(cards[0].album, 'عرس الشهادة');
  assert.equal(cards[0].title, 't10');
  assert.equal(cards[0].imageUrl, 'img10.jpg');
  assert.equal('count' in cards[0], false);
  assert.equal(cards[0].href, `/reciter?id=254&album=${encodeURIComponent('عرس الشهادة')}`);
  // No release: the reciter's page, newest first
  assert.equal(cards[1].album, '');
  assert.equal(cards[1].href, '/reciter?id=3');
});

test('newestFirstWhateverTheOrderGiven', () => {
  const cards = newReleasesOf([t(1, 5, 'أ', 'س'), t(30, 6, 'ب', 'ص'), t(20, 5, 'أ', 'ع')]);
  assert.deepEqual(cards.map(c => [c.reciterId, c.album]), [['6', 'ص'], ['5', 'ع']]);
});

test('atMostLimitCards', () => {
  const tracks = Array.from({ length: 50 }, (_, i) => t(100 - i, i + 1, `ر${i}`, null));
  assert.equal(newReleasesOf(tracks, 20).length, 20);
});

const settings = (over = {}) => ({ covers: {}, hidden: [], open: {}, ...over });
const SOME = [
  t(10, 254, 'محمد حجيرات', 'عرس الشهادة'),
  t(9, 263, 'Mohammad Al Hojairat', 'زينب والحزن'),
  t(8, 254, 'محمد حجيرات', 'موايد وافراح'),
  t(7, 3, 'باسم الكربلائي', null),
];

test('hiddenReciterLeftOut', () => {
  const cards = newReleasesOf(SOME, 2, settings({ hidden: ['263'] }));
  assert.deepEqual(cards.map(c => c.reciterId), ['254', '3']);
});

test('cardOpensTheReleaseTheOwnerChose', () => {
  const [card] = newReleasesOf(SOME, 20, settings({ open: { 254: 'موايد وافراح' } }));
  assert.equal(card.album, 'موايد وافراح');
  assert.equal(card.title, 't8');
  assert.equal(card.imageUrl, 'img8.jpg');
  assert.equal(card.href, `/reciter?id=254&album=${encodeURIComponent('موايد وافراح')}`);
});

test('cardWearsTheReleaseCoverTheOwnerChose', () => {
  const [card] = newReleasesOf(SOME, 20, settings({ covers: { 254: { 'عرس الشهادة': 'cover.jpg' } } }));
  assert.equal(card.imageUrl, 'cover.jpg');
});
