import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entryKey, forget, readHistory, remember } from '../../src/lib/search_history.ts';

const q = text => ({ kind: 'query', text });
const reciter = (id, name = `ر${id}`) => ({ kind: 'reciter', id, name, image: `${id}.jpg` });

test('newestFirstWithoutRepeats', () => {
  let list = remember([], q('باسم'));
  list = remember(list, reciter('2'));
  list = remember(list, q('  باسم  '));
  assert.deepEqual(list.map(entryKey), ['q:باسم', 'reciter:2']);
  assert.equal(list[0].text, 'باسم');
});

test('keepsAtMostTen', () => {
  let list = [];
  for (let i = 0; i < 15; i++) list = remember(list, reciter(String(i)));
  assert.equal(list.length, 10);
  assert.equal(list[0].id, '14');
});

test('emptyQueryNotKept', () => {
  const list = [q('أ')];
  assert.equal(remember(list, q('   ')), list);
});

test('forgetRemovesOne', () => {
  const list = [q('أ'), reciter('2'), q('ب')];
  assert.deepEqual(forget(list, 'reciter:2').map(entryKey), ['q:أ', 'q:ب']);
});

test('storedHistoryReadSafely', () => {
  assert.deepEqual(readHistory(null), []);
  assert.deepEqual(readHistory('{bad'), []);
  const raw = JSON.stringify([q('س'), { kind: 'track' }, reciter('3', 'ب'), 5, { kind: 'category', id: 'naei', name: 'نعي' }]);
  assert.deepEqual(readHistory(raw).map(entryKey), ['q:س', 'reciter:3', 'category:naei']);
});
