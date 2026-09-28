// POST /api/contact  { kind, name, email, subject?, message?, website? }
// Stores a message from one of the site's forms (contact, support, jobs,
// reciter / publisher sign-up) in the contact_messages table. That table has
// RLS on and no policies, so only this Function (service key) can write it
// and only the owner can read it, in Supabase → Table Editor.
import { json, db } from '../../cloudflare/server-api.js';

const KINDS = ['contact', 'support', 'job', 'artist', 'publisher'];
const LIMITS = { name: 200, email: 200, subject: 300, message: 5000 };

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'invalid body' }, 400);

  // Hidden field real visitors never fill in; bots do. Pretend it worked.
  if (body.website) return json({ ok: true });

  const clean = {};
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = body[field] ?? '';
    if (typeof value !== 'string' || value.length > max) return json({ error: `invalid ${field}` }, 400);
    clean[field] = value.trim() || null;
  }
  if (!KINDS.includes(body.kind)) return json({ error: 'invalid kind' }, 400);
  if (!clean.name) return json({ error: 'name required' }, 400);
  if (!clean.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return json({ error: 'invalid email' }, 400);

  const res = await db(env, 'contact_messages', {
    method: 'POST',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ kind: body.kind, ...clean }),
  });
  if (!res.ok) return json({ error: 'save failed', detail: await res.text() }, 502);
  return json({ ok: true });
}
