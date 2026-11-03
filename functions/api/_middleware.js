// Lets the phone web app (on GitHub Pages) call these endpoints from the
// browser, e.g. to upload a profile photo. Only that one origin is allowed, and
// every endpoint still checks the caller's Supabase session itself.
//
// Against cross-site requests (CSRF): sessions travel in the Authorization
// header, never in a cookie, so another site can't borrow one; and a change
// (anything but GET/HEAD) sent from a page on another site is refused before
// it reaches an endpoint. Browsers always say where such a request comes from
// (Origin); the Android app, the desktop uploader and the GitHub workflows,
// which are no browser page, send none.
// (tests: scripts/site/api_origin.test.mjs)
const APP_ORIGIN = 'https://zafirai121.github.io';

const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

const READS = new Set(['GET', 'HEAD']);

export async function onRequest({ request, next }) {
  const origin = request.headers.get('origin');
  const fromApp = origin === APP_ORIGIN;

  if (request.method === 'OPTIONS') {
    return fromApp ? new Response(null, { status: 204, headers: corsHeaders }) : new Response(null, { status: 405 });
  }
  // The site itself (under any of its addresses), the web app, or no browser page at all
  if (!READS.has(request.method) && origin && !fromApp && origin !== new URL(request.url).origin) {
    return new Response(JSON.stringify({ error: 'cross-site request refused' }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const response = await next();
  if (!fromApp) return response;
  const withCors = new Response(response.body, response);
  for (const [k, v] of Object.entries(corsHeaders)) withCors.headers.set(k, v);
  return withCors;
}
