import { test } from 'node:test';
import assert from 'node:assert/strict';

// functions/api/login.js with a bucket in memory, Supabase and Turnstile answered here, and a clock we move
const kept = new Map();
const R2 = {
  get: async (k) => (kept.has(k) ? { json: async () => JSON.parse(kept.get(k)) } : null),
  put: async (k, v) => { kept.set(k, v); },
  delete: async (k) => { kept.delete(k); },
};
let now = 1_800_000_000_000;
Date.now = () => now;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: init.body.get('response') === 'good-token' }));
  const { password } = JSON.parse(init.body);
  return password === 'right'
    ? new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r' }))
    : new Response(JSON.stringify({ code: 400, error_code: 'invalid_credentials' }), { status: 400 });
};
const { onRequestPost } = await import('../../functions/api/login.js');
const env = { R2, TURNSTILE_SECRET: 'test' };
const tryWith = async (password, captchaToken) => {
  const res = await onRequestPost({ env, request: new Request('https://x/api/login', { method: 'POST', body: JSON.stringify({ email: ' Me@Example.com ', password, captchaToken }) }) });
  return { status: res.status, ...(await res.json()) };
};

test('theWholeRoad', async () => {
  for (let i = 1; i <= 4; i++) assert.equal((await tryWith('wrong')).status, 401);
  // The fifth wrong one says the robot check comes next
  assert.equal((await tryWith('wrong')).next, 'captcha');
  assert.equal((await tryWith('wrong')).status, 428);
  assert.equal((await tryWith('wrong', 'bad-token')).status, 428);
  // Sixth wrong (check passed): a wait of 30 s
  const sixth = await tryWith('wrong', 'good-token');
  assert.deepEqual([sixth.status, sixth.next, sixth.seconds], [401, 'wait', 30]);
  assert.equal((await tryWith('right', 'good-token')).status, 429);
  // Through 7, 8, 9 (each after its wait), the tenth locks for two days
  for (const wait of [30, 60, 120, 300]) {
    now += wait * 1000;
    const res = await tryWith('wrong', 'good-token');
    assert.equal(res.status, 401);
  }
  const locked = await tryWith('right', 'good-token');
  assert.equal(locked.status, 423);
  assert.equal(locked.until, now + 2 * 24 * 60 * 60 * 1000 - 300_000 + 300_000);
  // Two days on, the right password signs in and the count starts afresh
  now = locked.until;
  const ok = await tryWith('right');
  assert.deepEqual([ok.status, ok.access_token], [200, 'a']);
  assert.equal(kept.size, 0);
});
