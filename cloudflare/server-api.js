// Shared plumbing for the write endpoints the Flutter app calls. Users sign in
// with Firebase, which Supabase can't see, so every write goes through these
// Functions: they verify the Firebase ID token, decide what the caller may do,
// and only then touch the database with the service key (Pages secret
// SUPABASE_SERVICE_ROLE_KEY — it never leaves the server).
import { SUPABASE_URL } from './seo.js';
import { isFirebaseToken, verifyFirebaseClaims } from './firebase-auth.js';

const ADMIN_EMAILS = ['zafir.4k@gmail.com'];

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

// { uid, isAdmin } for a valid Firebase token, otherwise null
export async function getCaller(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const claims = isFirebaseToken(token) ? await verifyFirebaseClaims(token) : null;
  if (!claims) return null;
  const isAdmin = claims.email_verified === true && ADMIN_EMAILS.includes(String(claims.email).toLowerCase());
  return { uid: claims.sub, isAdmin };
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
