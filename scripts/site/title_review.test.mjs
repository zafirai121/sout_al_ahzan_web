// The read-only list of titles and names to review (scripts/title-review.mjs, decision D3/W11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, reviewRows, toCsv } from '../title-review.mjs';

const rows = [
  { id: 1, title: '1243. 1243. كلهم الراحو حسين', reciter_name: 'باسم الكربلائي' },
  { id: 2, title: 'يا حسين', reciter_name: 'باسم الكربلائي' },
  { id: 3, title: 'ناديتك', reciter_name: 'Haider Al Ebrahimy' },
  { id: 4, title: 'قصيدة | محرم', reciter_name: 'basim karbalaei' },
];

test('only what the rules point to, the kept title beside the shown one', () => {
  const lines = reviewRows(rows, { 'Basim Karbalaei': 'باسم الكربلائي' });
  assert.deepEqual(lines.map(l => l.id), [1, 3, 4]);
  assert.equal(lines[0].title, '1243. 1243. كلهم الراحو حسين');
  assert.equal(lines[0].shown, 'كلهم الراحو حسين');
  assert.equal(lines[1].notes, 'اسم رادود بحروف لاتينية');
  // No trusted Arabic name: left empty, never guessed
  assert.equal(lines[1].arabicName, '');
  assert.equal(lines[2].arabicName, 'باسم الكربلائي');
  assert.match(lines[2].notes, /فاصل عمودي/);
});

test('the sheet runs no formula and is not split at a comma, semicolon or tab', () => {
  assert.equal(csvCell('=1+1'), "'=1+1");
  assert.equal(csvCell('abc;=1+1'), '"abc;=1+1"');
  assert.equal(csvCell('أ, ب'), '"أ, ب"');
  assert.equal(csvCell('x\t=1'), '"x\t=1"');
  const csv = toCsv(reviewRows(rows));
  assert.ok(csv.startsWith('﻿'));
  assert.equal(csv.trim().split('\r\n').length, 1 + 3);
});
