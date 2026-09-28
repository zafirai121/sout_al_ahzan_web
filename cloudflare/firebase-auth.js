// Verifies Firebase Auth ID tokens (used by the Flutter app) inside a
// Cloudflare Function, following Firebase's "verify ID tokens using a
// third-party JWT library" rules: RS256 signature against Google's public
// keys, plus aud/iss/exp/iat/sub checks.

const FIREBASE_PROJECT_ID = 'zafirali55-ba798';
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

const b64urlToBytes = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const b64urlToJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

export function isFirebaseToken(token) {
  try {
    return b64urlToJson(token.split('.')[1]).iss === ISSUER;
  } catch {
    return false;
  }
}

async function getKey(kid) {
  // Google rotates these keys; cache at the edge per its Cache-Control.
  const res = await fetch(JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!res.ok) return null;
  const { keys } = await res.json();
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) return null;
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}

// Returns the Firebase uid, or null if the token is invalid.
export async function verifyFirebaseToken(token) {
  return (await verifyFirebaseClaims(token))?.sub ?? null;
}

// Returns the verified token claims (sub, email, email_verified, ...), or null.
export async function verifyFirebaseClaims(token) {
  try {
    const [h, p, s] = token.split('.');
    const header = b64urlToJson(h);
    const payload = b64urlToJson(p);
    if (header.alg !== 'RS256' || !header.kid) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== FIREBASE_PROJECT_ID || payload.iss !== ISSUER) return null;
    if (!(payload.exp > now) || !(payload.iat <= now + 60)) return null;
    if (typeof payload.sub !== 'string' || !payload.sub) return null;

    const key = await getKey(header.kid);
    if (!key) return null;
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`)
    );
    return ok ? payload : null;
  } catch {
    return null;
  }
}
