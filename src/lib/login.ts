// Signing in with a password through the site's own gate (functions/api/login.js),
// which counts wrong passwords: the robot check after five, a growing wait from
// the sixth, two days locked at the tenth. The session it gives is the same as
// Supabase's, kept by the Supabase client as any other.
import { supabase } from '@/lib/supabase';

// Cloudflare Turnstile, the robot check: the site's key, or Cloudflare's always-passing test key on this computer
export const TURNSTILE_SITE_KEY = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  ? '1x00000000000000000000AA'
  : '0x4AAAAAAFx4HoeG6BTR-jqv';

export type SignIn =
  | { ok: true }
  | { ok: false; reason: 'invalid'; next: 'captcha' | 'wait' | 'locked' | null; seconds?: number; until?: number }
  | { ok: false; reason: 'captcha' | 'unconfirmed' | 'failed' }
  | { ok: false; reason: 'wait'; seconds: number }
  | { ok: false; reason: 'locked'; until: number };

export async function signInWithGate(email: string, password: string, captchaToken: string): Promise<SignIn> {
  let res: Response;
  try {
    res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, captchaToken: captchaToken || undefined }),
    });
  } catch {
    return { ok: false, reason: 'failed' };
  }
  const body = await res.json().catch(() => ({}));
  if (res.ok && body.access_token) {
    const { error } = await supabase.auth.setSession({ access_token: body.access_token, refresh_token: body.refresh_token });
    return error ? { ok: false, reason: 'failed' } : { ok: true };
  }
  if (res.status === 401) return { ok: false, reason: 'invalid', next: body.next ?? null, seconds: body.seconds, until: body.until };
  if (res.status === 428) return { ok: false, reason: 'captcha' };
  if (res.status === 429) return { ok: false, reason: 'wait', seconds: Number(body.seconds) || 60 };
  if (res.status === 423) return { ok: false, reason: 'locked', until: Number(body.until) || Date.now() };
  if (res.status === 403) return { ok: false, reason: 'unconfirmed' };
  return { ok: false, reason: 'failed' };
}

/** "١٥ نوفمبر، ١٠:٣٠ م" for a lock's end */
export const lockEnds = (until: number) =>
  new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(until));
