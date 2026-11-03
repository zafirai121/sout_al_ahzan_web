// Album changes sent to /api/admin/library in batches it can write
// (scripts/batches.mjs): each album is one database request there, and a
// call may make 50 at most on Cloudflare's plan. node --test scripts/site/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { albumBatches } from '../batches.mjs';

const change = (id, album) => ({ id, album });

test('aHundredChangesAtMost', () => {
  const changes = Array.from({ length: 250 }, (_, i) => change(i + 1, 'إصدار واحد'));
  assert.deepEqual(albumBatches(changes).map((b) => b.length), [100, 100, 50]);
});

test('fortyAlbumsAtMost', () => {
  // 69 albums in 100 changes (as Basim's first batch was): two calls
  const changes = Array.from({ length: 100 }, (_, i) => change(i + 1, `إصدار ${i % 69}`));
  const batches = albumBatches(changes);
  for (const b of batches) assert.ok(new Set(b.map((c) => c.album)).size <= 40);
  assert.equal(batches.flat().length, 100);
});

test('noChangeLostOrRepeatedAndOrderKept', () => {
  const changes = Array.from({ length: 333 }, (_, i) => change(i + 1, i % 3 ? `إصدار ${i % 57}` : null));
  const flat = albumBatches(changes).flat();
  assert.deepEqual(flat.map((c) => c.id), changes.map((c) => c.id));
});
