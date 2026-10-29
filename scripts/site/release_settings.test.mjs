import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyChange, cleanSettings, emptySettings } from '../../cloudflare/release-settings.js';

const OWN = 'https://soutalahzan.com/user_uploads/a.jpg';

test('coverSetAndCleared', () => {
  const set = applyChange(emptySettings(), { action: 'cover', reciterId: '254', album: 'عرس الشهادة', imageUrl: OWN });
  assert.deepEqual(set.covers, { 254: { 'عرس الشهادة': OWN } });
  const cleared = applyChange(set, { action: 'cover', reciterId: '254', album: 'عرس الشهادة', imageUrl: null });
  assert.deepEqual(cleared.covers, {});
});

test('coverFromAnotherHostRefused', () => {
  assert.equal(applyChange(emptySettings(), { action: 'cover', reciterId: '254', album: 'أ', imageUrl: 'https://evil.example/a.jpg' }), null);
});

test('homeCardHiddenAndShownAgain', () => {
  const hidden = applyChange(emptySettings(), { action: 'hide', reciterId: '263', hidden: true });
  assert.deepEqual(hidden.hidden, ['263']);
  assert.deepEqual(applyChange(hidden, { action: 'hide', reciterId: '263', hidden: true }).hidden, ['263']);
  assert.deepEqual(applyChange(hidden, { action: 'hide', reciterId: '263', hidden: false }).hidden, []);
});

test('homeCardOpensChosenReleaseOrTheNewest', () => {
  const chosen = applyChange(emptySettings(), { action: 'open', reciterId: '254', album: 'موايد وافراح' });
  assert.deepEqual(chosen.open, { 254: 'موايد وافراح' });
  assert.deepEqual(applyChange(chosen, { action: 'open', reciterId: '254', album: null }).open, {});
});

test('renamedReleaseKeepsItsCoverAndHomeCard', () => {
  let s = applyChange(emptySettings(), { action: 'cover', reciterId: '254', album: 'قديم', imageUrl: OWN });
  s = applyChange(s, { action: 'open', reciterId: '254', album: 'قديم' });
  s = applyChange(s, { action: 'rename', reciterId: '254', from: 'قديم', to: ' جديد ' });
  assert.deepEqual(s.covers, { 254: { 'جديد': OWN } });
  assert.deepEqual(s.open, { 254: 'جديد' });
});

test('badChangesRefused', () => {
  const s = emptySettings();
  assert.equal(applyChange(s, { action: 'hide', reciterId: 'x', hidden: true }), null);
  assert.equal(applyChange(s, { action: 'open', reciterId: '1', album: '   ' }), null);
  assert.equal(applyChange(s, { action: 'rename', reciterId: '1', from: 'أ', to: '' }), null);
  assert.equal(applyChange(s, { action: 'what' }), null);
});

test('storedSettingsCleaned', () => {
  assert.deepEqual(cleanSettings(null), emptySettings());
  assert.deepEqual(cleanSettings({ covers: { 1: { أ: OWN, ب: 'https://evil.example/x.jpg' }, y: { أ: OWN } }, hidden: ['2', 3, 'z'], open: { 4: 'ج', 5: 7 } }),
    { covers: { 1: { أ: OWN } }, hidden: ['2'], open: { 4: 'ج' } });
});
