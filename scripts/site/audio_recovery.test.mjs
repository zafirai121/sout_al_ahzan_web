// A track whose connection drops before its end is asked for again (src/lib/audio_recovery.ts,
// used by src/context/PlayerContext.tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ATTEMPTS, retryDelay, shouldRetry, STALL_MS } from '../../src/lib/audio_recovery.ts';

test('tried again after a growing wait, a few times at most', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map(retryDelay), [1000, 2000, 4000, 8000, 15000, 15000, 15000]);
  assert.equal(retryDelay(-1), 1000);
  assert.ok(MAX_ATTEMPTS >= 3 && MAX_ATTEMPTS <= 8);
  // All the tries together: under a minute, then the play button again
  const total = Array.from({ length: MAX_ATTEMPTS }, (_, i) => retryDelay(i)).reduce((a, b) => a + b, 0);
  assert.ok(total <= 60_000, String(total));
  assert.ok(STALL_MS >= 10_000 && STALL_MS <= 30_000);
});

test('which errors are worth asking for the file again', () => {
  // The network failed: always (mid-track, or before it started)
  assert.equal(shouldRetry(2, true), true);
  assert.equal(shouldRetry(2, false), true);
  // Data cut short while playing reads as undecodable or unsupported: tried again
  assert.equal(shouldRetry(3, true), true);
  assert.equal(shouldRetry(4, true), true);
  assert.equal(shouldRetry(undefined, true), true);
  // A file that never played (missing, not audio): not asked for again and again
  assert.equal(shouldRetry(3, false), false);
  assert.equal(shouldRetry(4, false), false);
  // Aborted by the page itself (another track chosen): never
  assert.equal(shouldRetry(1, true), false);
});
