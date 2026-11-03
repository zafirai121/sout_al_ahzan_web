import { test } from 'node:test';
import assert from 'node:assert/strict';
import { afterFailure, CAPTCHA_AFTER, check, LOCK_AFTER, LOCK_MS, NONE } from '../../cloudflare/login-guard.js';

const NOW = 1_800_000_000_000;
const fail = (state, n, at = NOW) => { for (let i = 0; i < n; i++) state = afterFailure(state, at); return state; };

test('fiveTriesFreely', () => {
  const state = fail(NONE, CAPTCHA_AFTER - 1);
  assert.deepEqual(check(state, NOW, false), { ok: true });
});

test('afterFiveTheRobotCheck', () => {
  const state = fail(NONE, CAPTCHA_AFTER);
  assert.deepEqual(check(state, NOW, false), { ok: false, reason: 'captcha' });
  assert.deepEqual(check(state, NOW, true), { ok: true });
});

test('thenAWaitThatGrowsEachTime', () => {
  let state = fail(NONE, CAPTCHA_AFTER + 1);
  const first = check(state, NOW, true);
  assert.equal(first.reason, 'wait');
  assert.equal(first.seconds, 30);
  state = afterFailure(state, NOW);
  assert.equal(check(state, NOW, true).seconds, 60);
  // Once the wait is over, an attempt may go (with the robot check)
  assert.deepEqual(check(state, NOW + 60_000, true), { ok: true });
});

test('theTenthLocksForTwoDays', () => {
  const state = fail(NONE, LOCK_AFTER);
  const locked = check(state, NOW, true);
  assert.equal(locked.reason, 'locked');
  assert.equal(locked.until, NOW + LOCK_MS);
  assert.equal(LOCK_MS, 2 * 24 * 60 * 60 * 1000);
  assert.equal(check(state, NOW + LOCK_MS - 1000, true).reason, 'locked');
  // Two days on: a fresh start
  assert.deepEqual(check(state, NOW + LOCK_MS, false), { ok: true });
  assert.equal(afterFailure(state, NOW + LOCK_MS).failures, 1);
});

test('oldFailuresAreForgotten', () => {
  // Five mistakes a day ago don't ask for a robot check today
  const state = fail(NONE, CAPTCHA_AFTER, NOW - 25 * 60 * 60 * 1000);
  assert.deepEqual(check(state, NOW, false), { ok: true });
});
