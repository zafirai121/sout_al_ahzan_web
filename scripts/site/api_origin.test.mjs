// The API's guard against cross-site requests (functions/api/_middleware.js):
// a browser on another site can't make a visitor's browser send changes, and
// the web app's own origin is let through with its CORS headers.
// node --test scripts/site/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../../functions/api/_middleware.js';

const SITE = 'https://web.soutalahzan.com';
const APP = 'https://zafirai121.github.io';

// The endpoint behind the guard, and whether it was reached
function call(method, origin, path = '/api/update-track') {
  let reached = false;
  const headers = origin ? { origin } : {};
  const request = new Request(`${SITE}${path}`, { method, headers, ...(method === 'POST' && { body: '{}' }) });
  const next = async () => { reached = true; return new Response('{}', { status: 200 }); };
  return onRequest({ request, next }).then((response) => ({ response, reached }));
}

test('aChangeFromAnotherSiteIsRefused', async () => {
  const { response, reached } = await call('POST', 'https://evil.example');
  assert.equal(response.status, 403);
  assert.equal(reached, false);
});

test('theSiteItselfAndTheWebAppMayChange', async () => {
  for (const origin of [SITE, APP]) {
    const { response, reached } = await call('POST', origin);
    assert.equal(response.status, 200, origin);
    assert.equal(reached, true, origin);
  }
  // The web app gets its CORS headers, the site needs none
  assert.equal((await call('POST', APP)).response.headers.get('access-control-allow-origin'), APP);
  assert.equal((await call('POST', SITE)).response.headers.get('access-control-allow-origin'), null);
});

test('callsWithNoOriginAreNotFromABrowserPage', async () => {
  // The Android app, the desktop uploader and the GitHub workflows send none
  const { response, reached } = await call('POST', null);
  assert.equal(response.status, 200);
  assert.equal(reached, true);
});

test('readingIsNotAChange', async () => {
  const { response, reached } = await call('GET', 'https://evil.example', '/api/new-releases');
  assert.equal(response.status, 200);
  assert.equal(reached, true);
});

test('theWebAppsPreflightOnly', async () => {
  assert.equal((await call('OPTIONS', APP)).response.status, 204);
  assert.equal((await call('OPTIONS', 'https://evil.example')).response.status, 405);
});
