// One category code for each category (run by .github/workflows/library.yml;
// MODE = categories-plan | categories):
//
//   codes    each category written one way, the code the apps write and read
//            ("قصائد حسينية", "لطمية", "latmiya" → hussainiya_poems; "نعي" → naei…)
//   variety  the tracks in "منوعات" (what the website's upload gave every
//            track) sorted as the apps sort an upload: by the words of the
//            title ("دعاء…" → dua, "مولد…" → muwalid, "سورة…" → quran),
//            else a Hussaini poem (a nasheed for a reciter of nasheeds)
//   poems    a Hussaini poem whose title says it is a dua, a birth poem, a
//            na'i or a nasheed ("دعاء اليوم التاسع", "مواليد شعبان") goes there
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
// في مولد…" is a birth poem, "قصيدة زيارة الأربعين" a poem rather than a ziyara.
// Some only as the title's first word: "سورة يس" is the Quran, "سورة الماي" a
// poem; "زيارة عاشوراء" a ziyara, "مشاية زيارة الأربعين" a poem; "دعاء اليوم
// التاسع" a dua, "اوبريت نسالك الدعاء" not. "أفراح" alone is a birth poem in
// variety, but a poem may be al-Qasim's wedding ("أفراح الفتى"): there only with Sha'ban
const WORDS = [
  ['quran', { first: ['سوره', 'تلاوه'], any: ['ترتيل', 'مرتل'] }],
  ['dua', { first: ['دعاء', 'ادعيه', 'مناجاه', 'مناجات'], any: ['تعقيبات'] }],
  ['lectures', { any: ['محاضره', 'محاضرات'] }],
  ['muwalid', { any: ['مولد', 'مواليد', 'ولاده', 'ميلاد', 'مولود', 'تهنئه'], joyful: ['افراح'] }],
  ['naei', { any: ['نعي', 'نعاوي'] }],
  ['nasheed', { any: ['نشيد', 'انشوده', 'اناشيد'] }],
  ['hussainiya_poems', { any: ['قصيده', 'قصائد', 'لطميه', 'لطميات', 'شور'] }],
  ['ziyarat', { first: ['زياره'] }],
];
const PREFIXES = ['وبال', 'بال', 'وال', 'لل', 'ال', 'و', 'ب', 'ل'];
const forms = (w) => [w, ...PREFIXES.filter((p) => w.startsWith(p) && w.length > p.length + 2).map((p) => w.slice(p.length))];
function guess(title, poem = false) {
  const list = norm(title).split(/[^\p{L}]+/u).filter(Boolean);
  const all = new Set(list.flatMap(forms));
  const first = new Set(list.slice(0, 1).flatMap(forms));
  const joy = !poem || all.has('شعبان') || all.has('شعبانيه');
  return WORDS.find(([, { any = [], first: firsts = [], joyful = [] }]) => any.some((k) => all.has(k))
    || firsts.some((k) => first.has(k)) || (joy && joyful.some((k) => all.has(k))))?.[0] ?? null;
}
// A Hussaini poem whose title says otherwise goes only to these (a poem may be
// called "سورة الماي" or "زيارة الأربعين")
const FROM_POEMS = new Set(['dua', 'muwalid', 'naei', 'nasheed', 'lectures']);

const tracks = await rows('audio_library');
console.log(`${tracks.length} tracks`);

console.log('\n# Categories now');
const now = new Map();
for (const t of tracks) now.set(t.category ?? null, (now.get(t.category ?? null) || 0) + 1);
for (const [c, n] of [...now].sort((a, b) => b[1] - a[1])) console.log(`- ${JSON.stringify(c)}: ${n} → ${codeOf(c) ?? (c == null ? '(none)' : '(unknown, left)')}`);

// A reciter of nasheeds: at least 5 tracks out of variety, three in four of them nasheeds
const nasheeds = new Map();
for (const t of tracks) {
  const code = codeOf(t.category);
  if (!code || code === 'variety' || !t.reciter_name) continue;
  const [n, all] = nasheeds.get(t.reciter_name) || [0, 0];
  nasheeds.set(t.reciter_name, [n + (code === 'nasheed' ? 1 : 0), all + 1]);
}
const singsNasheeds = (r) => { const [n, all] = nasheeds.get(r) || [0, 0]; return all >= 5 && n / all >= 0.75; };

const changes = []; // { t, category, why }
const unknown = [];
for (const t of tracks) {
  const code = codeOf(t.category);
  if (code === undefined) { unknown.push(t); continue; }
  let next = code;
  let why = 'its code';
  const said = guess(t.title);
  if (code === 'variety' || code === null) {
    if (said) { next = said; why = 'its title'; } else if (singsNasheeds(t.reciter_name)) { next = 'nasheed'; why = 'a reciter of nasheeds'; } else { next = 'hussainiya_poems'; why = 'title says nothing: a poem'; }
  } else if (code === 'hussainiya_poems' && FROM_POEMS.has(guess(t.title, true))) {
    next = guess(t.title, true);
    why = 'its title';
  }
  if (next !== t.category) changes.push({ t, category: next, why });
}

console.log('\n# Plan');
const tally = new Map();
for (const c of changes) {
  const k = `${JSON.stringify(c.t.category ?? null)} → ${c.category} (${c.why})`;
  tally.set(k, (tally.get(k) || 0) + 1);
}
for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`- ${k}: ${n}`);
console.log(`\n${changes.length} tracks to change; ${unknown.length} with a category not known (left as they are)`);
for (const t of unknown.slice(0, 30)) console.log(`- ${t.id} «${t.title}»: ${JSON.stringify(t.category)}`);

const byTitle = changes.filter((c) => c.why === 'its title');
console.log(`\n## Moved by their titles: ${byTitle.length}`);
for (const c of byTitle) console.log(`- ${c.t.id} «${c.t.title}» ${c.t.reciter_name || ''}: ${codeOf(c.t.category) ?? '(none)'} → ${c.category}`);

const poems = changes.filter((c) => c.why !== 'its title' && c.why !== 'its code');
console.log(`\n## Variety tracks whose titles say nothing: ${poems.length}`);
const byReciter = new Map();
for (const c of poems) byReciter.set(`${c.t.reciter_name || '(none)'} → ${c.category}`, [...(byReciter.get(`${c.t.reciter_name || '(none)'} → ${c.category}`) || []), c]);
for (const [k, list] of [...byReciter].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`- ${k}: ${list.length} — ${list.filter((_, i) => i % Math.max(1, Math.floor(list.length / 8)) === 0).slice(0, 8).map((c) => `«${c.t.title}»`).join(' · ')}`);
}

// Titles that say another category than the one they are in, left (only shown)
const odd = tracks.filter((t) => {
  const c = codeOf(t.category);
  const g = guess(t.title);
  return c && !['variety', 'hussainiya_poems'].includes(c) && g && g !== c && g !== 'hussainiya_poems';
});
console.log(`\n## Left in a category their title does not say: ${odd.length}`);
for (const t of odd.slice(0, 30)) console.log(`- ${t.id} «${t.title}» ${t.reciter_name || ''}: ${codeOf(t.category)}, title says ${guess(t.title)}`);

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
