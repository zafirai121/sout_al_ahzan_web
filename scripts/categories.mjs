// One category code for each category (run by .github/workflows/library.yml;
// MODE = categories-plan | categories):
//
//   codes    each category written one way, the code the apps write and read
//            ("قصائد حسينية", "لطمية", "latmiya" → hussainiya_poems; "نعي" → naei…)
//   variety  the tracks in "منوعات" (what the website's upload gave every
//            track) sorted by the words of their title ("دعاء…" → dua,
//            "مولد…" → muwalid, "لطمية…" → hussainiya_poems), else by what
//            most of their reciter's other tracks are (at least 5 of them,
//            three in four the same); the rest stay in variety
//
// "categories-plan" only says what "categories" would do. Through
// /api/admin/library, which takes only these codes and keeps the categories
// as they were in the bucket (backups/categories/).
import { call, rows, norm } from './upkeep.mjs';

const MODE = process.env.MODE || 'categories-plan';

const CODES = {
  hussainiya_poems: ['hussainiya_poems', 'hussainiya', 'قصائد حسينية', 'لطميات وقصائد', 'لطمية', 'لطميات', 'latmiya', 'nazla', 'shoor', 'شور'],
  naei: ['naei', 'نعي'],
  muwalid: ['muwalid', 'مواليد'],
  dua: ['dua', 'أدعية ومناجاة', 'ادعية ومناجاة', 'أدعية', 'adhkar'],
  ziyarat: ['ziyarat', 'زيارات'],
  quran: ['quran', 'قرآن', 'قرآن كريم', 'قران'],
  nasheed: ['nasheed', 'أناشيد', 'اناشيد', 'anasheed'],
  lectures: ['lectures', 'محاضرات'],
  variety: ['variety', 'منوعات'],
};
const CODE = new Map(Object.entries(CODES).flatMap(([code, values]) => values.map((v) => [norm(v.trim()), code])));
const codeOf = (category) => (category == null || !String(category).trim() ? null : CODE.get(norm(String(category).trim())) ?? undefined);

// The words of a title that tell its category (folded), most telling first: "قصيدة
// في مولد…" is a birth poem, "قصيدة زيارة الأربعين" a poem rather than a ziyara
const WORDS = [
  ['quran', ['سوره', 'تلاوه', 'قران', 'ترتيل', 'مرتل', 'مجود']],
  ['dua', ['دعاء', 'ادعيه', 'مناجاه', 'مناجات', 'تعقيبات', 'كميل', 'الجوشن', 'الافتتاح', 'الندبه', 'السمات', 'التوسل']],
  ['lectures', ['محاضره', 'محاضرات', 'خطبه', 'خطب']],
  ['muwalid', ['مولد', 'مواليد', 'ولاده', 'ميلاد', 'مولود', 'افراح', 'تهنئه']],
  ['naei', ['نعي', 'نعاوي', 'نعيه', 'نعوه']],
  ['nasheed', ['نشيد', 'انشوده', 'اناشيد']],
  ['hussainiya_poems', ['قصيده', 'قصائد', 'لطميه', 'لطميات', 'شور']],
  ['ziyarat', ['زياره', 'زيارات']],
];
const PREFIXES = ['وبال', 'بال', 'وال', 'لل', 'ال', 'و', 'ب', 'ل'];
function guess(title) {
  const ws = new Set(norm(title).split(/[^\p{L}]+/u).filter(Boolean)
    .flatMap((w) => [w, ...PREFIXES.filter((p) => w.startsWith(p) && w.length > p.length + 2).map((p) => w.slice(p.length))]));
  return WORDS.find(([, keys]) => keys.some((k) => ws.has(k)))?.[0] ?? null;
}

const tracks = await rows('audio_library');
console.log(`${tracks.length} tracks`);

console.log('\n# Categories now');
const now = new Map();
for (const t of tracks) now.set(t.category ?? null, (now.get(t.category ?? null) || 0) + 1);
for (const [c, n] of [...now].sort((a, b) => b[1] - a[1])) console.log(`- ${JSON.stringify(c)}: ${n} → ${codeOf(c) ?? (c == null ? '(none)' : '(unknown, left)')}`);

// What most of each reciter's tracks are, from those not in variety
const ofReciter = new Map();
for (const t of tracks) {
  const code = codeOf(t.category);
  if (!code || code === 'variety' || !t.reciter_name) continue;
  if (!ofReciter.has(t.reciter_name)) ofReciter.set(t.reciter_name, new Map());
  const m = ofReciter.get(t.reciter_name);
  m.set(code, (m.get(code) || 0) + 1);
}
function mostOf(reciter) {
  const m = ofReciter.get(reciter);
  if (!m) return null;
  const total = [...m.values()].reduce((s, n) => s + n, 0);
  const [code, n] = [...m].sort((a, b) => b[1] - a[1])[0];
  return total >= 5 && n / total >= 0.75 ? code : null;
}

const changes = []; // { t, category, why }
const unknown = [];
for (const t of tracks) {
  const code = codeOf(t.category);
  if (code === undefined) { unknown.push(t); continue; }
  let next = code;
  let why = 'same category, its code';
  if (code === 'variety' || code === null) {
    const byTitle = guess(t.title);
    const byReciter = byTitle ? null : mostOf(t.reciter_name);
    if (byTitle) { next = byTitle; why = 'its title'; } else if (byReciter) { next = byReciter; why = `most of ${t.reciter_name}'s tracks`; } else { next = 'variety'; why = code ? 'same category, its code' : 'no category: variety'; }
  }
  if (next !== t.category) changes.push({ t, category: next, why });
}

console.log('\n# Plan');
const tally = new Map();
for (const c of changes) {
  const k = `${JSON.stringify(c.t.category ?? null)} → ${c.category} (${c.why.startsWith('most of') ? 'its reciter' : c.why})`;
  tally.set(k, (tally.get(k) || 0) + 1);
}
for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`- ${k}: ${n}`);
console.log(`\n${changes.length} tracks to change; ${unknown.length} with a category not known (left as they are)`);
for (const t of unknown.slice(0, 30)) console.log(`- ${t.id} «${t.title}»: ${JSON.stringify(t.category)}`);

const sorted = changes.filter((c) => c.why !== 'same category, its code');
console.log(`\n## Out of variety: ${sorted.length}`);
const byTo = new Map();
for (const c of sorted) byTo.set(c.category, [...(byTo.get(c.category) || []), c]);
for (const [to, list] of byTo) {
  console.log(`\n### → ${to}: ${list.length}`);
  for (const c of list.filter((_, i) => i % Math.max(1, Math.floor(list.length / 40)) === 0).slice(0, 40)) {
    console.log(`- ${c.t.id} «${c.t.title}» ${c.t.reciter_name || ''} [${c.why}]`);
  }
}
const stay = tracks.filter((t) => ['variety', null].includes(codeOf(t.category)) && !sorted.some((c) => c.t.id === t.id));
console.log(`\n## Staying in variety: ${stay.length}`);
const stayBy = new Map();
for (const t of stay) stayBy.set(t.reciter_name || '(none)', (stayBy.get(t.reciter_name || '(none)') || 0) + 1);
for (const [r, n] of [...stayBy].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`- ${r}: ${n} (${[...(ofReciter.get(r) || new Map())].map(([c, k]) => `${c} ${k}`).join(', ') || 'no other tracks'})`);
for (const t of stay.filter((_, i) => i % Math.max(1, Math.floor(stay.length / 40)) === 0).slice(0, 40)) console.log(`  - ${t.id} «${t.title}» ${t.reciter_name || ''}`);

// Titles that say another category than the one they are in (only shown)
const odd = tracks.filter((t) => { const c = codeOf(t.category); const g = guess(t.title); return c && c !== 'variety' && g && g !== c && g !== 'hussainiya_poems' && g !== 'ziyarat'; });
console.log(`\n## In a category their title does not say (not changed): ${odd.length}`);
for (const t of odd.slice(0, 40)) console.log(`- ${t.id} «${t.title}» ${t.reciter_name || ''}: ${codeOf(t.category)}, title says ${guess(t.title)}`);

if (MODE === 'categories') {
  console.log('\n# Changing');
  let done = 0;
  for (let i = 0; i < changes.length; i += 100) {
    const res = await call({ action: 'recategorize', changes: changes.slice(i, i + 100).map((c) => ({ id: c.t.id, category: c.category })) });
    done += res.recategorized.length;
  }
  console.log(`categories changed: ${done}`);
  const after = await rows('audio_library');
  const counts = new Map();
  for (const t of after) counts.set(t.category ?? null, (counts.get(t.category ?? null) || 0) + 1);
  console.log(`now: ${[...counts].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(' · ')}`);
}
