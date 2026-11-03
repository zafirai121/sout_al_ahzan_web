// POST /api/login  { email, password, captchaToken? } — signing in with a
// password, for the site and both apps, through the rules of
// cloudflare/login-guard.js: five tries freely, then the robot check
// (Cloudflare Turnstile) on each, from the sixth wrong password a wait that
// grows, and the tenth locks password sign-in for two days. Each account's
// wrong passwords are kept in the bucket (auth/attempts/<sha256 of the e-mail>),
// never the e-mail itself.
//
// Answers: 200 the session (access_token, refresh_token, …, as Supabase gives
// it); 401 wrong e-mail or password, with what the next try needs (next);
// 428 the robot check is due; 429 wait (seconds); 423 locked (until);
// 403 the e-mail is not confirmed yet.
//
// The robot check is verified here (TURNSTILE_SECRET, a Pages secret), or by
// Supabase when its own check is on (SUPABASE_CAPTCHA = "on"): a token works
// once, so it goes to one of the two.
import { json } from '../../cloudflare/server-api.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../../cloudflare/seo.js';
import { afterFailure, check, NONE } from '../../cloudflare/login-guard.js';

const AS_JSON = { httpMetadata: { contentType: 'application/json' } };

async function keyOf(email) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
  return `auth/attempts/${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')}.json`;
}

async function readState(env, key) {
  const object = await env.R2.get(key);
  return object ? (await object.json().catch(() => null)) ?? NONE : NONE;
}

// Cloudflare's answer on a robot-check token
async function passedTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form }).catch(() => null);
  const body = res?.ok ? await res.json().catch(() => null) : null;
  return body?.success === true;
}

// What a refused try says, and how it answers
function refused(decision) {
  if (decision.reason === 'locked') return json({ error: 'locked', until: decision.until }, 423);
  if (decision.reason === 'wait') return json({ error: 'wait', seconds: decision.seconds }, 429);
  return json({ error: 'captcha' }, 428);
}

export async function onRequestPost({ request, env }) {
  if (!env.R2) return json({ error: 'server not configured' }, 500);
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const token = typeof body?.captchaToken === 'string' && body.captchaToken.length < 4096 ? body.captchaToken : '';
  if (!email || email.length > 320 || !password || password.length > 1000) return json({ error: 'invalid body' }, 400);

  const now = Date.now();
  const key = await keyOf(email);
  const state = await readState(env, key);
  const supabaseChecks = env.SUPABASE_CAPTCHA === 'on';

  // Refused before Supabase is asked: locked, waiting, or the robot check due and not passed
  const due = check(state, now, true);
  if (!due.ok) return refused(due);
  if (!check(state, now, false).ok) {
    const passed = token && (supabaseChecks || (await passedTurnstile(env, token, request.headers.get('cf-connecting-ip'))));
    if (!passed) return json({ error: 'captcha' }, 428);
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, ...(supabaseChecks && token ? { gotrue_meta_security: { captcha_token: token } } : {}) }),
  });
  const answer = await res.json().catch(() => ({}));

  if (res.ok && answer.access_token) {
    if (state.failures) await env.R2.delete(key);
    return json(answer);
  }
  const code = String(answer.error_code || answer.code || answer.error || '');
  if (code === 'invalid_credentials' || code === 'invalid_grant') {
    const next = afterFailure(state, now);
    await env.R2.put(key, JSON.stringify(next), AS_JSON);
    const then = check(next, now, false);
    return json({ error: 'invalid', next: then.ok ? null : then.reason, ...(then.until && { until: then.until }), ...(then.seconds && { seconds: then.seconds }) }, 401);
  }
  if (code === 'email_not_confirmed') return json({ error: 'unconfirmed' }, 403);
  if (code.includes('captcha')) return json({ error: 'captcha' }, 428);
  if (res.status === 429) return json({ error: 'wait', seconds: 60 }, 429);
  return json({ error: 'sign-in failed', code }, 502);
}
