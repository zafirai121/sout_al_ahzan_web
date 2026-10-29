import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changedFields } from '../../src/lib/track_edit.ts';

const row = { title: 'يحسين', reciter_name: 'محمد حجيرات', category: 'naei', album: 'عرس الشهادة', lyrics: null, occasion: '', year: '1446', location: null, image_url: 'a.jpg' };

test('nothingChangedSendsNothing', () => {
  assert.deepEqual(changedFields(row, { ...row, lyrics: '', title: ' يحسين ' }), { fields: {} });
});

test('onlyWhatChangedIsSent', () => {
  assert.deepEqual(changedFields(row, { ...row, title: 'يحسين بضمايرنه ', year: '1447' }), { fields: { title: 'يحسين بضمايرنه', year: '1447' } });
});

test('anEmptiedFieldIsCleared', () => {
  assert.deepEqual(changedFields(row, { ...row, album: '  ', year: '' }), { fields: { album: null, year: null } });
});

test('titleAndReciterCannotBeEmpty', () => {
  assert.deepEqual(changedFields(row, { ...row, title: ' ' }), { missing: 'title' });
  assert.deepEqual(changedFields(row, { ...row, reciter_name: '' }), { missing: 'reciter_name' });
});
