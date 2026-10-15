// GET /api/cutouts → { "reciter's name": "their photo without its background (WebP)" }
// for the apps' playlist cards (made by scripts/cutouts.*, kept in cutouts/index.json).
// Public, as the photos themselves are; the phone web app reads it through
// _middleware.js's CORS.
export async function onRequestGet({ env }) {
  const obj = env.R2 ? await env.R2.get('cutouts/index.json') : null;
  const index = obj ? await obj.json() : {};
  const byName = Object.fromEntries(Object.values(index).map((c) => [c.name, c.url]));
  return new Response(JSON.stringify(byName), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600' },
  });
}
