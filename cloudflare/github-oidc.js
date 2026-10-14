// Checks that a request comes from one of this repository's own GitHub
// Actions workflows: the workflow asks GitHub for an OpenID Connect token
// (a JWT signed by GitHub, naming the repository, branch and workflow that
// asked) and sends it as its bearer token. No secret is kept anywhere: the
// signature is checked against GitHub's published keys.
const ISSUER = 'https://token.actions.githubusercontent.com';

let keys = null; // GitHub's signing keys, kept while this isolate lives
let keysAt = 0;

const fromBase64Url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const decodeJson = (s) => JSON.parse(new TextDecoder().decode(fromBase64Url(s)));

async function signingKey(kid, fetcher) {
  const fresh = keys && Date.now() - keysAt < 60 * 60 * 1000;
  if (!fresh || !keys.some((k) => k.kid === kid)) {
    const res = await fetcher(`${ISSUER}/.well-known/jwks`);
    if (!res.ok) return null;
    keys = (await res.json()).keys || [];
    keysAt = Date.now();
  }
  const jwk = keys.find((k) => k.kid === kid && k.kty === 'RSA');
  if (!jwk) return null;
  return crypto.subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}

/**
 * The token's claims when [request] carries a valid GitHub Actions token for
 * [audience], from [workflow] (".github/workflows/x.yml") of [repository] run
 * on [ref]; otherwise null.
 */
export async function githubWorkflowCaller(request, { audience, repository, workflow, ref }, fetcher = fetch) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = decodeJson(parts[0]);
    if (header.alg !== 'RS256' || !header.kid) return null;
    const key = await signingKey(header.kid, fetcher);
    if (!key) return null;
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromBase64Url(parts[2]), signed))) return null;
    const claims = decodeJson(parts[1]);
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== ISSUER || !audiences.includes(audience)) return null;
    if (!(claims.exp > now) || (claims.nbf && claims.nbf > now + 60)) return null;
    if (claims.repository !== repository || claims.ref !== ref) return null;
    if (claims.workflow_ref !== `${repository}/${workflow}@${ref}`) return null;
    return claims;
  } catch {
    return null;
  }
}
