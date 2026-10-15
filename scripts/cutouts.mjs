// The reciters' photos without their background, for the apps' playlist cards
// (run by .github/workflows/library.yml; MODE = cutouts-plan | cutouts):
//   prepare  downloads the photos with no cut-out yet, or a new photo since
//            (FILES: reciter ids to redo, | between), to work/in, listed in work/todo.json
//   (scripts/cutouts.py takes their background away, to work/out)
//   upload   keeps the good ones (cutouts) through /api/admin/library, which
//            lists them in cutouts/index.json; the plan only shows them, on
//            the reports branch (out/cutouts)
import fs from 'node:fs';
import { call, rows } from './upkeep.mjs';

const step = process.argv[2];
const redo = new Set((process.env.FILES || '').split(/[|\n,]/).map((s) => s.trim()).filter(Boolean));

if (step === 'prepare') {
  const index = await call({ action: 'cutouts' });
  const reciters = (await rows('reciters')).filter((r) => r.image_url && /^https:\/\//.test(r.image_url));
  const todo = reciters.filter((r) => redo.has(String(r.id)) || index[r.id]?.source !== r.image_url);
  console.log(`${reciters.length} reciters with a photo; ${Object.keys(index).length} cut out already; ${todo.length} to do`);
  fs.mkdirSync('work/in', { recursive: true });
  const list = [];
  for (const r of todo) {
    const res = await fetch(r.image_url, { headers: { 'user-agent': 'SawtAlahzanLibrary/1.0' } }).catch(() => null);
    if (!res?.ok) { console.log(`- ${r.id} ${r.name}: ${res?.status ?? 'unreachable'}`); continue; }
    const file = `work/in/${r.id}`;
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    list.push({ id: r.id, name: r.name, source: r.image_url, file });
  }
  fs.writeFileSync('work/todo.json', JSON.stringify(list, null, 1));
}

if (step === 'upload') {
  const done = JSON.parse(fs.readFileSync('work/done.json', 'utf8'));
  const good = done.filter((d) => d.ok);
  console.log(`${done.length} cut out; ${good.length} good; ${done.length - good.length} left with their photo (${done.filter((d) => !d.ok).map((d) => `${d.name}: ${d.why}`).join('، ') || '—'})`);
  if (process.env.MODE === 'cutouts') {
    for (const d of good) {
      const webp = fs.readFileSync(d.out).toString('base64');
      const res = await call({ action: 'cutout', id: d.id, name: d.name, source: d.source, webp });
      console.log(`- ${d.id} ${d.name}: ${res.key} (${Math.round(res.size / 1024)} KB)${res.replaced ? ', replacing the last' : ''}`);
    }
  } else {
    // The plan: the cut-outs on the reports branch, to be looked at
    fs.mkdirSync('out/cutouts', { recursive: true });
    for (const d of done) if (d.out) fs.copyFileSync(d.out, `out/cutouts/${d.ok ? '' : 'rejected-'}${d.id}.webp`);
    fs.writeFileSync('out/cutouts/done.json', JSON.stringify(done, null, 1));
  }
}
