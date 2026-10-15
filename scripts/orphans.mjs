// The songs in the bucket that no track plays (run by .github/workflows/library.yml;
// MODE = orphans): only says, for each, where it is, whose its folder is, how long
// it is, the category its title points to, and the library's tracks it may be a
// copy of (the same file content, or a title sharing its words), with links to
// listen. Nothing is changed.
import { bucket, rows, keyOf, linkOf, words, AUDIO, seconds } from './upkeep.mjs';

const objects = await bucket();
const tracks = await rows('audio_library');
const used = new Set(tracks.map((t) => keyOf(t.file_url)).filter(Boolean));
const byKey = new Map(objects.map((o) => [o.key, o]));
const folderOf = (key) => key.split('/')[0];

// Whose a folder is: the reciter most of its tracks have
const folderReciter = new Map();
for (const t of tracks) {
  const k = keyOf(t.file_url);
  if (!k || !k.includes('/')) continue;
  const f = folderOf(k);
  if (!folderReciter.has(f)) folderReciter.set(f, new Map());
  const m = folderReciter.get(f);
  m.set(t.reciter_name, (m.get(t.reciter_name) || 0) + 1);
}
const whose = (f) => [...(folderReciter.get(f) || new Map())].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} (${c})`).join('، ') || 'لا مقاطع له في المكتبة';

// The category a title points to (scripts/categories.mjs's words)
const fold = (s) => String(s).toLowerCase().replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
const WORDS = [
  ['quran', { first: ['سوره', 'تلاوه'], any: ['ترتيل', 'مرتل'] }],
  ['dua', { first: ['دعاء', 'ادعيه', 'مناجاه', 'مناجات'], any: ['تعقيبات'] }],
  ['lectures', { any: ['محاضره', 'محاضرات'] }],
  ['muwalid', { any: ['مولد', 'مواليد', 'ولاده', 'ميلاد', 'مولود', 'افراح', 'تهنئه'] }],
  ['naei', { any: ['نعي', 'نعاوي'] }],
  ['nasheed', { any: ['نشيد', 'انشوده', 'اناشيد'] }],
  ['hussainiya_poems', { any: ['قصيده', 'قصائد', 'لطميه', 'لطميات', 'شور'] }],
  ['ziyarat', { first: ['زياره'] }],
];
const PREFIXES = ['وبال', 'بال', 'وال', 'لل', 'ال', 'و', 'ب', 'ل'];
const forms = (w) => [w, ...PREFIXES.filter((p) => w.startsWith(p) && w.length > p.length + 2).map((p) => w.slice(p.length))];
function category(title) {
  const list = fold(title).split(/[^\p{L}]+/u).filter(Boolean);
  const all = new Set(list.flatMap(forms));
  const first = new Set(list.slice(0, 1).flatMap(forms));
  return WORDS.find(([, w]) => (w.any || []).some((k) => all.has(k)) || (w.first || []).some((k) => first.has(k)))?.[0] ?? 'hussainiya_poems (العنوان لا يدل على شيء)';
}
const clock = (s) => (s == null ? '?' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);

const orphans = objects.filter((o) => AUDIO.test(o.key) && !used.has(o.key) && !o.key.startsWith('user_uploads/'));
console.log(`${orphans.length} songs in the bucket that no track plays\n`);
for (const o of orphans) {
  const name = o.key.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
  const folder = o.key.includes('/') ? folderOf(o.key) : '(أعلى الحاوية)';
  const length = await seconds(linkOf(o.key)).catch(() => null);
  console.log(`## ${o.key}`);
  console.log(`- المجلد: ${folder} ← مقاطع المجلد في المكتبة: ${whose(folder)}`);
  console.log(`- الحجم ${(o.size / 1024 ** 2).toFixed(1)} MB · المدة ${clock(length)} · رُفع ${o.uploaded.slice(0, 10)}`);
  console.log(`- التصنيف من عنوانه: ${category(name)}`);
  console.log(`- للاستماع: ${linkOf(o.key)}`);
  // The same content, or a title sharing its words
  const same = tracks.filter((t) => { const x = byKey.get(keyOf(t.file_url)); return x && x.etag === o.etag && x.size === o.size; });
  for (const t of same) console.log(`  - نفس الملف تماماً: ${t.id} «${t.title}» ${t.reciter_name} ${t.duration}`);
  const w = words(name);
  const close = tracks.map((t) => {
    const tw = words(t.title);
    let common = 0;
    for (const x of w) if (tw.has(x)) common++;
    return { t, score: w.size ? common / Math.max(w.size, tw.size) : 0, common };
  }).filter((x) => x.common > 0 && x.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 6);
  for (const { t } of close) console.log(`  - عنوان قريب: ${t.id} «${t.title}» ${t.reciter_name} ${t.duration} ${t.file_url}`);
  if (!same.length && !close.length) console.log('  - لا مقطع قريب منه في المكتبة');
  console.log('');
}
