// Text values in a database filter (cloudflare/server-api.js quotedList): each
// one quoted, so a comma, bracket or quote inside it stays part of the value
// and can't change the filter. node --test scripts/site/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quotedList } from '../../cloudflare/server-api.js';

test('eachValueQuoted', () => {
  assert.equal(quotedList(['https://soutalahzan.com/a.mp3', 'b']), '"https://soutalahzan.com/a.mp3","b"');
});

test('aValueCannotEndItsQuotesOrTheList', () => {
  // Without escaping, this one would close its quotes and add a filter of its own
  assert.equal(quotedList(['a"),id.gt.(0']), '"a\\"),id.gt.(0"');
  assert.equal(quotedList(['back\\slash']), '"back\\\\slash"');
});
