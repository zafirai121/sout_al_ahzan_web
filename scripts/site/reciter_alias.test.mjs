import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aliasesAfterMerge, reciterPage } from '../../cloudflare/reciters.js';

// The reciters table as the service role reads it, and what was written to it
function fakeDb(rows) {
  const writes = [];
  const db = async (_env, path, init = {}) => {
    if ((init.method ?? 'GET') !== 'GET') {
      writes.push([init.method, path]);
      const made = { id: 999, name: JSON.parse(init.body ?? '{}').name };
      rows.push(made);
      return { ok: true, status: 201, json: async () => [made] };
    }
    return { ok: true, status: 200, json: async () => rows };
  };
  return { db, writes };
}
const bucket = (aliases) => ({ R2: { get: async () => (aliases ? { json: async () => aliases } : null) } });

test('mergedNameGoesToThePageItWasMergedInto', async () => {
  const { db, writes } = fakeDb([{ id: 254, name: 'محمد حجيرات' }]);
  const page = await reciterPage(bucket({ mohammadalhojairat: 254 }), 'Mohammad Al Hojairat', db);
  assert.deepEqual(page, { id: 254, name: 'محمد حجيرات', created: false });
  assert.deepEqual(writes, []);
});

test('withoutAliasesANewNameStillGetsItsPage', async () => {
  const { db, writes } = fakeDb([{ id: 254, name: 'محمد حجيرات' }]);
  const page = await reciterPage({}, 'كرار ابو غنيم', db);
  assert.equal(page.created, true);
  assert.equal(writes.length, 1);
});

test('aliasesKeepPointingAfterAnotherMerge', () => {
  // 263 merged into 254, then 254 into 300: both names go to 300
  let aliases = aliasesAfterMerge({}, 'Mohammad Al Hojairat', 263, 254);
  assert.deepEqual(aliases, { mohammadalhojairat: 254 });
  aliases = aliasesAfterMerge(aliases, 'محمد حجيرات', 254, 300);
  assert.deepEqual(aliases, { mohammadalhojairat: 300, محمدحجيرات: 300 });
});
