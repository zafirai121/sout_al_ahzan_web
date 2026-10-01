// Lets the phone web app (on GitHub Pages) call these endpoints from the
// browser, e.g. to upload a profile photo. Only that one origin is allowed, and
// every endpoint still checks the caller's Supabase session itself.
const APP_ORIGIN = 'https://zafirai121.github.io';

const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

export async function onRequest({ request, next }) {
  const fromApp = request.headers.get('origin') === APP_ORIGIN;

  if (request.method === 'OPTIONS') {
    return fromApp ? new Response(null, { status: 204, headers: corsHeaders }) : new Response(null, { status: 405 });
  }

  const response = await next();
  if (!fromApp) return response;
  const withCors = new Response(response.body, response);
  for (const [k, v] of Object.entries(corsHeaders)) withCors.headers.set(k, v);
  return withCors;
}
