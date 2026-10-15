// Library upkeep (run by .github/workflows/library.yml; MODE = plan | import | delete):
//
//   plan    says what import and delete would do, and changes nothing
//   import  adds a track for each song file in the bucket that no track points to
//           (the reciters' folders, not people's uploads), when the app has no
//           track of that title by that reciter yet: the title from the file's
//           name, the reciter, category and owner as that folder's tracks have
//           them, the cover beside it (same name), the length measured (ffprobe)
//   delete  removes the tracks whose file is gone from the bucket, and the
//           uploads that never became a track (people's audio files that no
//           track points to, older than two days, with the cover sent with
//           each; nothing else of theirs)
//
// Through /api/admin/library, which checks again what makes each step safe.
import {
  call, bucket, rows, keyOf, linkOf, AUDIO, IMAGE, stem, norm, words, majority, titleOf, seconds,
} from './upkeep.mjs';

const MODE = process.env.MODE || 'plan';

// Folders whose tracks are not in the app yet: who the reciter is (their name as the reciters table has it)
const FOLDER_RECITER = {
  'MustafaAl-Sudani': 'مصطفى السوداني',
};

// ─── What is there ───────────────────────────────────────────────────────────
const objects = await bucket();
const byKey = new Map(objects.map((o) => [o.key, o]));
const tracks = await rows('audio_library');
const reciters = await rows('reciters');
const profiles = await rows('profiles').catch(() => []);
const playlists = await rows('user_playlists').catch(() => []);
console.log(`bucket ${objects.length} objects · ${tracks.length} tracks · ${reciters.length} reciters · ${profiles.length} profiles · ${playlists.length} playlists`);

const used = new Set();
const walk = (v) => {
  if (typeof v === 'string') { const k = keyOf(v); if (k) used.add(k); }
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
tracks.forEach(walk); reciters.forEach(walk); profiles.forEach(walk); playlists.forEach(walk);

// How the tracks keep their length (seconds as a number, or text)
const durations = tracks.map((t) => t.duration).filter((d) => d != null);
const durationAsText = durations.filter((d) => typeof d === 'string').length > durations.length / 2;
console.log(`durations: ${durations.length} of ${tracks.length} tracks have one; e.g. ${JSON.stringify(durations.slice(0, 6))}`);
const categories = majority(tracks.map((t) => t.category));
console.log(`categories: ${[...new Set(tracks.map((t) => t.category))].slice(0, 20).join(' · ')}`);

// ─── Import: songs in the reciters' folders that no track points to ──────────
const folderOf = (key) => key.split('/')[0];
const byFolder = new Map();
for (const t of tracks) {
  const key = keyOf(t.file_url);
  if (!key || key.startsWith('user_uploads/')) continue;
  const f = folderOf(key);
  if (!byFolder.has(f)) byFolder.set(f, []);
  byFolder.get(f).push(t);
}
const recByName = new Map(reciters.map((r) => [norm(r.name).replace(/\s+/g, ' ').trim(), r]));
function profileOf(folder) {
  const own = byFolder.get(folder) || [];
  if (own.length) {
    const name = majority(own.map((t) => t.reciter_name));
    const coverBeside = own.filter((t) => { const c = keyOf(t.image_url); return c && stem(c) === stem(keyOf(t.file_url)); }).length;
    return {
      reciter_name: name,
      reciter_id: majority(own.filter((t) => t.reciter_name === name).map((t) => t.reciter_id)),
      category: majority(own.map((t) => t.category)),
      user_id: majority(own.map((t) => t.user_id)),
      from: `${own.length} tracks of the folder (${coverBeside} with the cover beside the file)`,
    };
  }
  const name = FOLDER_RECITER[folder];
  if (!name) return null;
  const rec = recByName.get(norm(name).replace(/\s+/g, ' ').trim());
  const theirs = tracks.filter((t) => t.reciter_name === name);
  return {
    reciter_name: rec?.name || name,
    reciter_id: rec?.id ?? null,
    category: majority(theirs.map((t) => t.category)) ?? categories,
    user_id: majority(tracks.filter((t) => !keyOf(t.file_url)?.startsWith('user_uploads/')).map((t) => t.user_id)),
    from: rec ? `the reciters table (id ${rec.id})` : 'FOLDER_RECITER (not in the reciters table)',
  };
}

const titledBy = new Map(); // reciter -> folded titles of their tracks
for (const t of tracks) {
  const r = t.reciter_name || '';
  if (!titledBy.has(r)) titledBy.set(r, []);
  titledBy.get(r).push(words(t.title));
}
const reciterWords = new Set([...reciters.map((r) => r.name), ...tracks.map((t) => t.reciter_name)].flatMap((n) => [...words(n)]));
// The app already has it: a track of this reciter whose title's own words are (nearly) all in this title's
function inApp(title, reciter) {
  const tw = new Set([...words(title)].filter((w) => !reciterWords.has(w)));
  if (!tw.size) return false;
  return (titledBy.get(reciter) || []).some((w0) => {
    const w = new Set([...w0].filter((x) => !reciterWords.has(x)));
    if (!w.size) return false;
    let common = 0;
    for (const x of w) if (tw.has(x)) common++;
    return common / w.size >= 0.8 && common / tw.size >= 0.5;
  });
}

const coverOf = new Map(objects.filter((c) => IMAGE.test(c.key)).map((c) => [stem(c.key), c]));
const profiles_ = new Map();
const folderProfile = (f) => { if (!profiles_.has(f)) profiles_.set(f, profileOf(f)); return profiles_.get(f); };
const plan = [];
const skipped = { noReciter: new Map(), inApp: [], twice: [] };
const seenTitles = new Set();
for (const o of objects) {
  if (!AUDIO.test(o.key) || used.has(o.key)) continue;
  const folder = folderOf(o.key);
  if (folder === 'user_uploads' || folder === 'thumbs' || !o.key.includes('/')) continue;
  const p = folderProfile(folder);
  if (!p) { skipped.noReciter.set(folder, (skipped.noReciter.get(folder) || 0) + 1); continue; }
  const name = o.key.split('/').pop();
  const title = titleOf(name, p.reciter_name);
  if (inApp(title, p.reciter_name)) { skipped.inApp.push(`${o.key} ≈ a track of ${p.reciter_name}`); continue; }
  const id = `${p.reciter_name}|${[...words(title)].sort().join(' ')}`;
  if (seenTitles.has(id)) { skipped.twice.push(o.key); continue; }
  seenTitles.add(id);
  const cover = coverOf.get(stem(o.key));
  plan.push({ o, folder, row: {
    title, file_name: name, reciter_name: p.reciter_name, reciter_id: p.reciter_id, category: p.category, user_id: p.user_id,
    file_url: linkOf(o.key), image_url: cover ? linkOf(cover.key) : null,
  } });
}

// ─── Delete: tracks whose file is gone; uploads that never became a track ────
const broken = tracks.filter((t) => { const k = keyOf(t.file_url); return k && !byKey.has(k); });
const old = (o) => Date.now() - Date.parse(o.uploaded) > 2 * 24 * 60 * 60 * 1000;
const deadAudio = objects.filter((o) => o.key.startsWith('user_uploads/') && AUDIO.test(o.key) && !used.has(o.key) && old(o));
const deadStems = new Set(deadAudio.map((o) => o.key.replace(/\/audio_([^/]+)\.[a-z0-9]+$/i, '/$1')));
const deadCovers = objects.filter((o) => o.key.startsWith('user_uploads/') && IMAGE.test(o.key) && !used.has(o.key) && old(o)
  && deadStems.has(o.key.replace(/\/image_([^/]+)\.[a-z0-9]+$/i, '/$1')));
const MB = (b) => `${(b / 1024 ** 2).toFixed(1)} MB`;
const GB = (b) => `${(b / 1024 ** 3).toFixed(2)} GB`;

console.log('\n# Plan');
console.log(`\n## Import: ${plan.length} songs, ${GB(plan.reduce((s, x) => s + x.o.size, 0))}`);
const perFolder = new Map();
for (const x of plan) perFolder.set(x.folder, (perFolder.get(x.folder) || 0) + 1);
for (const [folder, n] of perFolder) {
  const p = folderProfile(folder);
  const withCover = plan.filter((x) => x.folder === folder && x.row.image_url).length;
  console.log(`- ${folder}: ${n} songs (${withCover} with a cover) → reciter «${p.reciter_name}» (id ${p.reciter_id}), category «${p.category}», owner ${p.user_id}; from ${p.from}`);
}
console.log(`- left out: ${skipped.inApp.length} the app already has, ${skipped.twice.length} the same song twice, ${[...skipped.noReciter].map(([f, n]) => `${n} in ${f}/ (no reciter known)`).join(', ') || 'none without a reciter'}`);
for (const s of skipped.inApp.slice(0, 10)) console.log(`  - already: ${s}`);
for (const s of skipped.twice.slice(0, 5)) console.log(`  - twice: ${s}`);
console.log('- titles, e.g.:');
for (const x of plan.filter((_, i) => i % Math.max(1, Math.floor(plan.length / 40)) === 0).slice(0, 40)) {
  console.log(`  - «${x.row.title}»  ←  ${x.row.file_name}${x.row.image_url ? '' : '  (no cover)'}`);
}
console.log(`\n## Delete: ${broken.length} tracks whose file is gone`);
for (const t of broken) console.log(`- track ${t.id} «${t.title}» (${t.reciter_name})`);
console.log(`## Delete: ${deadAudio.length} uploads that never became a track (${GB(deadAudio.reduce((s, o) => s + o.size, 0))}), with ${deadCovers.length} covers sent with them`);
for (const o of deadAudio.slice(0, 10)) console.log(`- ${MB(o.size)} ${o.uploaded.slice(0, 10)} ${o.key}`);

// ─── Do it ───────────────────────────────────────────────────────────────────
if (MODE === 'import') {
  console.log(`\n# Importing ${plan.length} songs`);
  let done = 0;
  const failed = [];
  for (let i = 0; i < plan.length; i += 10) {
    const batch = plan.slice(i, i + 10);
    await Promise.all(batch.map(async (x) => {
      const s = await seconds(x.row.file_url);
      if (s != null) x.row.duration = durationAsText ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : s;
    }));
    let res;
    try {
      res = await call({ action: 'insert', rows: batch.map((x) => x.row), retries: 1 });
    } catch (e) {
      // One of them breaks the call: each on its own, the one that fails left out (and said)
      console.log(`batch at ${i} failed (${e.message}); one at a time`);
      res = { inserted: [], already: [] };
      for (const x of batch) {
        try {
          const one = await call({ action: 'insert', rows: [x.row], retries: 1 });
          res.inserted.push(...one.inserted);
          res.already.push(...one.already);
        } catch (e2) {
          failed.push(x);
          console.log(`  left out: ${x.o.key} (${e2.message})`);
        }
      }
    }
    done += res.inserted.length + res.already.length;
    console.log(`${done}/${plan.length} added (last: ${res.inserted.at(-1)?.id} «${res.inserted.at(-1)?.title}»)`);
  }
  console.log(`Imported ${done} songs; left out ${failed.length}.`);
  for (const x of failed) console.log(`- left out: ${x.o.key} → ${JSON.stringify(x.row).slice(0, 400)}`);
}

if (MODE === 'delete') {
  console.log('\n# Deleting');
  for (let i = 0; i < broken.length; i += 20) {
    const res = await call({ action: 'delete-tracks', ids: broken.slice(i, i + 20).map((t) => t.id) });
    console.log(`tracks deleted: ${res.deleted.join(', ') || 'none'}; kept: ${res.kept.join(', ') || 'none'}`);
  }
  const keys = [...deadAudio, ...deadCovers].map((o) => o.key);
  let deleted = 0;
  const kept = [];
  for (let i = 0; i < keys.length; i += 12) {
    const res = await call({ action: 'delete-uploads', keys: keys.slice(i, i + 12) });
    deleted += res.deleted.length;
    kept.push(...res.kept);
  }
  console.log(`uploads deleted: ${deleted}; kept: ${kept.length}`);
  for (const [k, why] of kept.slice(0, 20)) console.log(`- kept ${k}: ${why}`);
}
