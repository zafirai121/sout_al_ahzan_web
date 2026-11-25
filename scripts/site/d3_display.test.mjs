// Decisions D3: counts (A3), the categories offered (C3), the titles shown (W11).
// node --test scripts/site/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countOf, formatNumber, nounAfter, SECTIONS, TRACKS } from '../../src/utils/plural.ts';
import { browsableCategories, CATEGORY_LIST, guessCategory } from '../../src/utils/categories.ts';
import { isLatinName, titleNotes, withoutTechnicalNumbering } from '../../src/utils/titles.ts';

test('counts: thousands apart, and the noun as Arabic counts it', () => {
  assert.equal(formatNumber(13550), '13,550');
  assert.equal(countOf(13550, TRACKS), '13,550 مقطعاً');
  assert.equal(countOf(13500, TRACKS), '13,500 مقطع');
  assert.equal(countOf(2707, TRACKS), '2,707 مقاطع');
  assert.equal(countOf(498, TRACKS), '498 مقطعاً');
  assert.equal(countOf(2, TRACKS), 'مقطعان');
  assert.equal(countOf(1, TRACKS), 'مقطع واحد');
  assert.equal(countOf(0, TRACKS), '0 مقطع');
  assert.equal(nounAfter(7, SECTIONS), 'أقسام');
  assert.equal(nounAfter(13550, TRACKS), 'مقطعاً');
});

test('categories: the names decided, an empty one left out until it has tracks', () => {
  const title = (id) => CATEGORY_LIST.find(c => c.id === id)?.title;
  assert.equal(title('quran'), 'القرآن الكريم');
  assert.equal(title('lectures'), 'محاضرات');
  assert.equal(title('variety'), 'منوعات');
  // Not known yet: all of them
  assert.equal(browsableCategories(CATEGORY_LIST, null).length, CATEGORY_LIST.length);
  const shown = browsableCategories(CATEGORY_LIST, { variety: false, lectures: true }).map(c => c.id);
  assert.equal(shown.includes('variety'), false);
  assert.equal(shown.includes('lectures'), true);
  // Not answered counts as having tracks: nothing hidden on a guess
  assert.equal(shown.includes('hussainiya_poems'), true);
  // Back once it has tracks
  assert.equal(browsableCategories(CATEGORY_LIST, { variety: true }).some(c => c.id === 'variety'), true);
  // A lecture is filed under «محاضرات», as the app files it now
  assert.equal(guessCategory('محاضرة عن الإمام الحسين'), 'lectures');
});

test('titles: the technical numbering goes where they are shown, nothing else', () => {
  assert.equal(withoutTechnicalNumbering('1243. 1243. كلهم الراحو حسين'), 'كلهم الراحو حسين');
  assert.equal(withoutTechnicalNumbering('784. ناديتك يا حسين'), 'ناديتك يا حسين');
  assert.equal(withoutTechnicalNumbering('008 - نار الهجر'), 'نار الهجر');
  assert.equal(withoutTechnicalNumbering('03 - يا حسين'), 'يا حسين');
  assert.equal(withoutTechnicalNumbering('313 يا مهدي'), '313 يا مهدي');
  assert.equal(withoutTechnicalNumbering('313 - يا مهدي'), '313 - يا مهدي');
  assert.equal(withoutTechnicalNumbering('عاشوراء 1446'), 'عاشوراء 1446');
  assert.equal(withoutTechnicalNumbering('1243. 1243.'), '1243. 1243.');
});

test('titles: what a reviewer is pointed to', () => {
  assert.deepEqual(titleNotes('1243. 1243. كلهم الراحو حسين'), ['ترقيم تقني']);
  assert.deepEqual(titleNotes('يا حسين | باسم الكربلائي'), ['فاصل عمودي']);
  assert.deepEqual(titleNotes('وسط القلب.mp3'), ['امتداد ملف']);
  assert.deepEqual(titleNotes('يا حسين مظلوم يا حسين مظلوم'), ['تكرار']);
  assert.deepEqual(titleNotes('يا حسين'), []);
  assert.equal(isLatinName('Haider Al Ebrahimy'), true);
  assert.equal(isLatinName('باسم الكربلائي'), false);
});
