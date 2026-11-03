// The headers every page is sent with (public/_headers): never inside a frame,
// not even the site's own (it frames none of its pages), HTTPS only, and no
// guessing of file types. node --test scripts/site/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
// The headers under "/*", as "Name: value" lines
const everyPage = rules.split(/\r?\n(?=\S)/).find((block) => block.startsWith('/*'));

test('noPageInsideAFrame', () => {
  assert.match(everyPage, /^\s+X-Frame-Options: DENY$/m);
  assert.match(everyPage, /^\s+Content-Security-Policy: .*frame-ancestors 'none'/m);
  assert.doesNotMatch(rules, /SAMEORIGIN|frame-ancestors 'self'/);
});

test('theOtherSafetyHeadersStay', () => {
  assert.match(everyPage, /Strict-Transport-Security: max-age=31536000; includeSubDomains/);
  assert.match(everyPage, /X-Content-Type-Options: nosniff/);
  assert.match(everyPage, /Referrer-Policy: strict-origin-when-cross-origin/);
});
