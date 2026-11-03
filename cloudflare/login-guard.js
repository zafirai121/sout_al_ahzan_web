// What wrong passwords cost an account (functions/api/login.js), the same on
// the site and both apps: five tries freely; then the robot check (Cloudflare
// Turnstile) on every try; from the sixth wrong one a wait before the next, a
// longer one each time; the tenth locks password sign-in for two days. A day
// with no wrong password forgets the earlier ones. Nothing here touches the
// network: the state is kept by the caller.

export const CAPTCHA_AFTER = 5;
export const LOCK_AFTER = 10;
export const LOCK_MS = 2 * 24 * 60 * 60 * 1000;
const FORGET_MS = 24 * 60 * 60 * 1000;
// Seconds to wait after the 6th, 7th, 8th and 9th wrong password
const WAITS = [30, 60, 120, 300];

/** An account with no wrong passwords. */
export const NONE = Object.freeze({ failures: 0, last: 0, lockedUntil: 0 });

// The state as it stands at [now]: a lock that is over, or wrong passwords a day old, start afresh
function current(state, now) {
  if (!state || typeof state.failures !== 'number') return NONE;
  if (state.lockedUntil) return now >= state.lockedUntil ? NONE : state;
  return state.last && now - state.last >= FORGET_MS ? NONE : state;
}

/** The state after a wrong password at [now]. */
export function afterFailure(state, now) {
  const failures = current(state, now).failures + 1;
  return { failures, last: now, lockedUntil: failures >= LOCK_AFTER ? now + LOCK_MS : 0 };
}

/**
 * Whether a sign-in may be tried at [now]: { ok: true }, or why not —
 * 'locked' (until when), 'wait' (how many seconds more), or 'captcha' (the
 * robot check is due and [passedCheck] is false).
 */
export function check(state, now, passedCheck) {
  const s = current(state, now);
  if (s.lockedUntil) return { ok: false, reason: 'locked', until: s.lockedUntil };
  if (s.failures > CAPTCHA_AFTER) {
    const wait = WAITS[Math.min(s.failures - CAPTCHA_AFTER - 1, WAITS.length - 1)] * 1000;
    if (now < s.last + wait) return { ok: false, reason: 'wait', seconds: Math.ceil((s.last + wait - now) / 1000) };
  }
  if (s.failures >= CAPTCHA_AFTER && !passedCheck) return { ok: false, reason: 'captcha' };
  return { ok: true };
}
