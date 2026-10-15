// One name for each reciter (run by .github/workflows/library.yml;
// MODE = reciters-plan | reciters):
//
// the names on the tracks that are the same reciter written another way
// ("اباذر الحلواجي" / "أباذر الحلواجي", "عبدالحميد" / "عبد الحميد", with or
// without "الرادود", "الملا", "السيد", or in Latin letters as the apps translate
// them: "basim_karbalaei") are given one: the reciters table's when it has the
// reciter (with its id), else the one most of their tracks have. A track whose
// name is the table's but whose reciter_id is not gets the table's id. Names a
// letter apart are only listed: they may be two reciters.
//
// "reciters-plan" only says what "reciters" would do. Through /api/admin/library,
// which keeps the rows as they were in the bucket (backups/reciters/).
import { call, rows, norm, distance } from './upkeep.mjs';

const MODE = process.env.MODE || 'reciters-plan';

// As the apps translate the names written in Latin letters (Models.kt RECITER_TRANSLATIONS)
const LATIN = {
  'basim karbalaei': 'باسم الكربلائي', basim_karbalaei: 'باسم الكربلائي', 'mulla basim': 'باسم الكربلائي',
  'ammar al kinani': 'عمار الكناني', ammar_alkinani: 'عمار الكناني',
  'qahtan al bdeiri': 'قحطان البديري', qahtan_al_bdeiri: 'قحطان البديري',
  'muslim al waeli': 'مسلم الوائلي', muslim_al_waeli: 'مسلم الوائلي',
  'ali al delfi': 'علي الدلفي', ali_delphi: 'علي الدلفي', ali_aldelfi: 'علي الدلفي',
  'hussain faisal': 'حسين فيصل', hussein_faisal: 'حسين فيصل',
  'mohammed al halfi': 'محمد الحلفي', mohamed_alhalfi: 'محمد الحلفي',
  'hussain al akraf': 'حسين الأكرف', hussain_alakraf: 'حسين الأكرف',
  murtadha_harb: 'مرتضى حرب', 'murtadha harb': 'مرتضى حرب',
  sayed_faqid: 'سيد فاقد الموسوي', sayed_faqid_almousawi: 'سيد فاقد الموسوي',
  mustafa_alsudani: 'مصطفى السوداني', ali_bouhamad: 'علي بوحمد', mohammed_bujbara: 'محمد بوجبارة',
  ahmed_alsaeedi: 'أحمد الساعدي', mohammed_al_jnaid: 'محمد الجنامي', mohamed_aljanami: 'محمد الجنامي',
};
const TITLES = new Set(['الرادود', 'رادود', 'الملا', 'ملا', 'السيد', 'سيد', 'الشيخ', 'شيخ', 'الحاج', 'حاج', 'المنشد', 'منشد', 'القاري', 'القارئ', 'الخطيب']);
const arabic = (name) => LATIN[String(name).toLowerCase().trim()] ?? String(name).trim();
// The name as compared: folded, no titles, no spaces ("عبد الحميد" = "عبدالحميد")
const keyOf = (name) => {
  const ws = norm(arabic(name)).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const rest = ws.filter((w) => !TITLES.has(w));
  return (rest.length ? rest : ws).join('');
};

const tracks = await rows('audio_library');
const table = await rows('reciters');
console.log(`${tracks.length} tracks · ${table.length} reciters in the table`);

const groups = new Map(); // key -> { names: Map(name -> tracks), rows: [] }
const group = (k) => { if (!groups.has(k)) groups.set(k, { names: new Map(), rows: [] }); return groups.get(k); };
for (const t of tracks) {
  if (!t.reciter_name || !String(t.reciter_name).trim()) continue;
  const g = group(keyOf(t.reciter_name));
  g.names.set(t.reciter_name, [...(g.names.get(t.reciter_name) || []), t]);
}
for (const r of table) if (r.name) group(keyOf(r.name)).rows.push(r);

console.log(`\n# Tracks with no reciter: ${tracks.filter((t) => !t.reciter_name || !String(t.reciter_name).trim()).length}`);

const moves = []; // { ids, to: { reciter } | { like }, name, from }
const tableTwice = [];
for (const [, g] of groups) {
  if (!g.names.size) continue;
  if (g.rows.length > 1) tableTwice.push(g);
  // The table's row: the one whose name tracks already have most, else the first;
  // a row named in Latin letters is not given to tracks (the apps translate it)
  const row = [...g.rows].filter((r) => arabic(r.name) === r.name.trim())
    .sort((a, b) => (g.names.get(b.name)?.length || 0) - (g.names.get(a.name)?.length || 0))[0];
  if (row) {
    for (const [name, list] of g.names) {
      const off = list.filter((t) => name !== row.name || String(t.reciter_id ?? '') !== String(row.id));
      if (off.length) moves.push({ ids: off.map((t) => t.id), to: { reciter: row.id }, name: row.name, from: name, why: name === row.name ? "the table's id" : "the table's name" });
    }
  } else if (g.names.size > 1) {
    // The name most of their tracks have, one in Arabic letters first
    const [best, bestList] = [...g.names].sort((a, b) => Number(arabic(b[0]) === b[0]) - Number(arabic(a[0]) === a[0]) || b[1].length - a[1].length)[0];
    for (const [other, list] of g.names) {
      if (other !== best) moves.push({ ids: list.map((t) => t.id), to: { like: bestList[0].id }, name: best, from: other, why: 'most of their tracks' });
    }
  }
}

console.log(`\n# Plan: ${moves.reduce((s, m) => s + m.ids.length, 0)} tracks`);
const renames = moves.filter((m) => m.from !== m.name);
console.log(`\n## Another spelling of the same reciter: ${renames.length} names, ${renames.reduce((s, m) => s + m.ids.length, 0)} tracks`);
for (const m of renames) console.log(`- «${m.from}» (${m.ids.length}) → «${m.name}» [${m.why}]`);
const ids = moves.filter((m) => m.from === m.name);
console.log(`\n## The table's name, not its id: ${ids.reduce((s, m) => s + m.ids.length, 0)} tracks of ${ids.length} reciters`);
for (const m of ids.slice(0, 30)) console.log(`- «${m.name}»: ${m.ids.length}`);

console.log(`\n## Reciters twice in the table (left: follows point to them): ${tableTwice.length}`);
for (const g of tableTwice) console.log(`- ${g.rows.map((r) => `${r.id} «${r.name}»${r.image_url ? ' (photo)' : ''}`).join(' · ')}; on tracks: ${[...g.names].map(([n, l]) => `«${n}» ${l.length}`).join(', ')}`);

// Names a letter or two apart: maybe the same reciter, maybe not (only listed)
const keys = [...groups].filter(([, g]) => g.names.size).map(([k, g]) => [k, g]);
console.log('\n## Close names (not changed)');
for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
  const [a, ga] = keys[i];
  const [b, gb] = keys[j];
  if (Math.min(a.length, b.length) < 6 || Math.abs(a.length - b.length) > 2) continue;
  if (distance(a, b) <= (Math.min(a.length, b.length) >= 10 ? 2 : 1)) {
    const show = (g) => [...g.names].map(([n, l]) => `«${n}» ${l.length}`).join(', ');
    console.log(`- ${show(ga)}  ~  ${show(gb)}`);
  }
}

if (MODE === 'reciters') {
  console.log('\n# Changing');
  let done = 0;
  for (const m of moves) {
    for (let i = 0; i < m.ids.length; i += 20) {
      const res = await call({ action: 'reciter', ids: m.ids.slice(i, i + 20), ...m.to });
      done += res.moved.length;
    }
  }
  console.log(`tracks given their reciter's one name: ${done}`);
}
