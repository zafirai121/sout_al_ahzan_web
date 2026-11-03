// Album changes in batches /api/admin/library can write in one call: 100
// changes at most (what it takes), and 40 albums at most, since each album is
// one database request there and Cloudflare lets a call make 50 (a batch of
// Basim's with 69 albums stopped after the 49th). In order, none lost.
// (tests: scripts/site/album_batches.test.mjs)
export function albumBatches(changes, { size = 100, albums = 40 } = {}) {
  const out = [];
  let batch = [];
  let names = new Set();
  for (const c of changes) {
    if (batch.length === size || (!names.has(c.album) && names.size === albums)) {
      out.push(batch);
      batch = [];
      names = new Set();
    }
    batch.push(c);
    names.add(c.album);
  }
  if (batch.length) out.push(batch);
  return out;
}
