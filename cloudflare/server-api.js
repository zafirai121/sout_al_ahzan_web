// Shared plumbing for the endpoints the app and website call for what Row Level
// Security can't express: uploads to R2, admin edits/deletes, account deletion.
// Users sign in with Supabase Auth; these Functions check the caller's session,
// decide what they may do, and only then act with the service key (Pages
// secret SUPABASE_SERVICE_ROLE_KEY — it never leaves the server).
import { SUPABASE_URL, SUPABASE_KEY } from './seo.js';

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

// { uid, isAdmin, isAnonymous } for a valid Supabase session token, otherwise null.
// isAnonymous: a guest (Supabase anonymous sign-in) who may listen but not publish.
// Supabase checks the token itself (signature, expiry, signed-out sessions).
// Admin comes from app_metadata, which only the service role can set — not
// from the email, since sign-up does not confirm email ownership.
export async function getCaller(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  if (typeof user?.id !== 'string') return null;
  return { uid: user.id, isAdmin: user.app_metadata?.role === 'admin', isAnonymous: user.is_anonymous === true };
}

// fetch() against Supabase REST as the service role
export function db(env, path, init = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...init.headers,
    },
  });
}

// Images must live on our own storage, never an arbitrary host
const IMAGE_HOSTS = ['https://soutalahzan.com/', `${SUPABASE_URL}/storage/v1/object/public/`];
export const isOwnImageUrl = (url) =>
  typeof url === 'string' && url.length <= 1000 && IMAGE_HOSTS.some((prefix) => url.startsWith(prefix));
