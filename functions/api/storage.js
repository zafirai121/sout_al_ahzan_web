// What the R2 bucket behind soutalahzan.com holds, for the storage audit
// (scripts/storage-audit.mjs, run by .github/workflows/storage.yml): every
// object's key, size, upload date, ETag (an MD5 of the content for a file put
// in one piece) and type, a thousand at a time. Read only. Only that workflow
// may ask, proving who it is with GitHub's OpenID Connect token (see
// cloudflare/github-oidc.js).
//
// GET /api/storage?cursor=…  → { objects: [[key, size, uploaded, etag, type]], cursor }
import { json } from '../../cloudflare/server-api.js';
import { githubWorkflowCaller } from '../../cloudflare/github-oidc.js';

const WORKFLOW = {
  audience: 'soutalahzan-storage',
  repository: 'zafirai121/sout_al_ahzan_web',
  workflow: '.github/workflows/storage.yml',
  ref: 'refs/heads/main',
};

export async function onRequestGet({ request, env }) {
  if (!env.R2) return json({ error: 'R2 binding is not configured' }, 500);
  if (!(await githubWorkflowCaller(request, WORKFLOW))) return json({ error: 'forbidden' }, 403);
  const cursor = new URL(request.url).searchParams.get('cursor') || undefined;
  const page = await env.R2.list({ cursor, limit: 1000, include: ['httpMetadata'] });
  return json({
    objects: page.objects.map((o) => [o.key, o.size, o.uploaded.toISOString().slice(0, 10), o.etag, o.httpMetadata?.contentType || '']),
    cursor: page.truncated ? page.cursor : null,
  });
}
