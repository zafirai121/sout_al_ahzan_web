import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overDailyLimit, PER_DAY } from '../../cloudflare/upload-limits.js';

// A bucket holding these keys, listed as R2 lists them (sorted, after startAfter, within prefix)
const bucket = (keys) => ({
  list: async ({ prefix, startAfter, limit }) => ({
    objects: [...keys].sort().filter((k) => k.startsWith(prefix) && (!startAfter || k > startAfter)).slice(0, limit).map((key) => ({ key })),
  }),
});
const NOW = 1_793_700_000_000;
const HOUR = 3_600_000;
const uploads = (n, kind, ago) => Array.from({ length: n }, (_, i) => `user_uploads/u1/${kind}_${NOW - ago - i}_x.mp3`);

test('underTheLimitUploads', async () => {
  assert.equal(await overDailyLimit(bucket(uploads(PER_DAY.audio - 1, 'audio', HOUR)), 'u1', 'audio', NOW), false);
});

test('aDayFullIsRefused', async () => {
  assert.equal(await overDailyLimit(bucket(uploads(PER_DAY.audio, 'audio', HOUR)), 'u1', 'audio', NOW), true);
});

test('yesterdaysAndOthersDoNotCount', async () => {
  const keys = [...uploads(PER_DAY.audio, 'audio', 25 * HOUR), ...uploads(PER_DAY.audio, 'image', HOUR), ...uploads(5, 'audio', HOUR).map((k) => k.replace('/u1/', '/u2/'))];
  assert.equal(await overDailyLimit(bucket(keys), 'u1', 'audio', NOW), false);
});
