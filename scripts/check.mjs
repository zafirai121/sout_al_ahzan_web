// A look at a few things, changing nothing (run by .github/workflows/library.yml;
// MODE = check, FILES = what to look at, | between): a number is a track (its
// row as stored, its file's key and whether the bucket has it); backups/…json is
// a row kept before a change; anything else is looked for in the bucket's keys.
import { call, bucket, rows, keyOf, norm } from './upkeep.mjs';

const asked = (process.env.FILES || '').split(/[|\n]/).map((s) => s.trim()).filter(Boolean);
const objects = await bucket();
const byKey = new Map(objects.map((o) => [o.key, o]));
const tracks = await rows('audio_library');
const show = (o) => (o ? `in the bucket: ${(o.size / 1024 ** 2).toFixed(2)} MB, etag ${o.etag}, uploaded ${o.uploaded}` : 'NOT in the bucket');

for (const a of asked) {
  if (/^\d+$/.test(a)) {
    const t = tracks.find((x) => String(x.id) === a);
    console.log(`\n## track ${a}`);
    if (!t) { console.log('no such track'); continue; }
    console.log(JSON.stringify(t));
    for (const f of ['file_url', 'image_url']) {
      const k = keyOf(t[f]);
      console.log(`- ${f}: ${JSON.stringify(t[f])} → key ${JSON.stringify(k)} ${k ? show(byKey.get(k)) : ''}`);
      // the same key, written another way, on other tracks
      const others = tracks.filter((x) => x.id !== t.id && k && (keyOf(x.file_url) === k || keyOf(x.image_url) === k));
      for (const x of others) console.log(`  - also on track ${x.id} «${x.title}»: ${JSON.stringify(x.file_url === t[f] ? 'the same string' : x[f])}`);
    }
  } else if (a.startsWith('backups/')) {
    console.log(`\n## ${a}`);
    try {
      const b = await call({ action: 'backup', key: a });
      console.log(JSON.stringify(b));
      const row = b.removed || b;
      for (const f of ['file_url', 'image_url']) {
        if (!row[f]) continue;
        const k = keyOf(row[f]);
        console.log(`- ${f}: ${JSON.stringify(row[f])} → key ${JSON.stringify(k)} ${k ? show(byKey.get(k)) : ''}`);
        for (const x of tracks.filter((x) => k && keyOf(x.file_url) === k)) console.log(`  - now on track ${x.id} «${x.title}» as ${JSON.stringify(x.file_url)}`);
      }
    } catch (e) {
      console.log(`unreadable: ${e.message}`);
    }
  } else {
    const n = norm(a);
    const found = objects.filter((o) => norm(o.key).includes(n));
    console.log(`\n## keys with «${a}»: ${found.length}`);
    for (const o of found.slice(0, 30)) console.log(`- ${JSON.stringify(o.key)} ${show(o)}`);
  }
}
