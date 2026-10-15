// A few of the library's pictures, for drawing designs from (run by
// .github/workflows/library.yml; MODE = covers): for some of the apps'
// playlists (as the home screen makes them), the cover of their first track
// and the photo of their reciter most heard in them, saved under out/covers
// with index.json. Nothing is changed.
import fs from 'node:fs';
import { rows, norm } from './upkeep.mjs';

// [name, categories, words in the titles] (the apps' THEMES)
const THEMES = [
  ['عاشوراء', ['hussainiya_poems', 'naei'], ['عاشوراء', 'محرم', 'الحسين', 'حسين', 'كربلاء', 'الطف']],
  ['الأربعين', ['hussainiya_poems', 'naei'], ['الأربعين', 'اربعين', 'المشاية', 'مشاية', 'زوار', 'الزائر']],
  ['قمر بني هاشم', ['hussainiya_poems', 'naei', 'muwalid'], ['العباس', 'أبو الفضل', 'ابا الفضل', 'أبي الفضل', 'قمر بني هاشم']],
  ['الزهراء (ع)', ['naei', 'hussainiya_poems', 'muwalid'], ['الزهراء', 'فاطمة', 'فاطمية', 'الفاطمية']],
  ['أمير المؤمنين (ع)', ['hussainiya_poems', 'naei', 'muwalid'], ['أمير المؤمنين', 'حيدر', 'الكرار', 'المحراب', 'الكوفة', 'يا علي']],
  ['السيدة زينب (ع)', ['hussainiya_poems', 'naei', 'muwalid'], ['زينب', 'العقيلة']],
  ['مواليد أهل البيت', ['muwalid'], []],
  ['نعي وعزاء', ['naei'], []],
];
const tracks = await rows('audio_library');
const reciters = await rows('reciters');
const photoOf = new Map(reciters.filter((r) => r.image_url).map((r) => [r.name, r.image_url]));
fs.mkdirSync('out/covers', { recursive: true });

async function save(url, name) {
  if (!url) return null;
  const res = await fetch(url, { headers: { 'user-agent': 'SawtAlahzanLibrary/1.0' } });
  if (!res.ok) { console.log(`- ${url}: ${res.status}`); return null; }
  const type = res.headers.get('content-type') || '';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const file = `${name}.${ext}`;
  fs.writeFileSync(`out/covers/${file}`, Buffer.from(await res.arrayBuffer()));
  return file;
}

const index = [];
for (const [i, [name, cats, words]] of THEMES.entries()) {
  const keys = words.map(norm);
  const list = tracks.filter((t) => cats.includes(t.category) && (!keys.length || keys.some((k) => norm(t.title).includes(k))))
    .sort((a, b) => (b.listen_count || 0) - (a.listen_count || 0)).slice(0, 50);
  const first = list.find((t) => t.image_url);
  const counts = new Map();
  for (const t of list) if (photoOf.has(t.reciter_name)) counts.set(t.reciter_name, (counts.get(t.reciter_name) || 0) + 1);
  const reciter = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const entry = {
    name, tracks: list.length,
    cover: await save(first?.image_url, `t${i}-cover`), coverTrack: first ? `${first.title} – ${first.reciter_name}` : null,
    reciter, photo: await save(reciter && photoOf.get(reciter), `t${i}-reciter`),
  };
  console.log(JSON.stringify(entry));
  index.push(entry);
}
fs.writeFileSync('out/covers/index.json', JSON.stringify(index, null, 1));
