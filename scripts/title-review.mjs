// Titles and reciters' names to review by hand (decision D3/W11). READ ONLY:
// it never writes to the library, never renames a file or changes a link. It
// lists the tracks whose title has technical numbering, a vertical bar, a file
// extension or a repeated half, and the reciters named in Latin letters, beside
// what the site would show and, where a trusted list has one, the reciter's
// Arabic name. A person checks the list; any change is made one by one after.
//
//   node scripts/title-review.mjs --input rows.json [--names trusted-names.json] [--out review.csv]
//   SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/title-review.mjs [--out review.csv]
//
// rows.json: [{ "id": 1, "title": "…", "reciter_name": "…" }, …]
// trusted-names.json: { "Latin name as written": "الاسم العربي" } (reviewed by a person)
// The second form reads the public library (GET only, as any visitor's browser).

import { readFileSync, writeFileSync } from 'node:fs';
import { isLatinName, titleNotes, withoutTechnicalNumbering } from '../src/utils/titles.ts';
import { countOf, TRACKS } from '../src/utils/plural.ts';

/** The lines to review: one per track the rules point to, its title as kept beside what would show. */
export function reviewRows(rows, trusted = {}) {
  const names = new Map(Object.entries(trusted).map(([k, v]) => [k.trim().toLowerCase(), v]));
  const out = [];
  for (const row of rows) {
    const title = String(row.title ?? '');
    const reciter = String(row.reciter_name ?? '');
    const notes = titleNotes(title);
    const latin = reciter && isLatinName(reciter);
    if (latin) notes.push('اسم رادود بحروف لاتينية');
    if (!notes.length) continue;
    out.push({
      id: row.id,
      title,
      shown: withoutTechnicalNumbering(title),
      notes: notes.join('، '),
      reciter,
      arabicName: latin ? names.get(reciter.trim().toLowerCase()) ?? '' : '',
    });
  }
  return out;
}

// A cell that Excel or another sheet can't run as a formula, nor split at a
// comma, a semicolon or a tab (the list separator differs between computers)
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",;\t\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(lines) {
  const head = ['رقم المقطع', 'العنوان كما هو محفوظ', 'العنوان كما يُعرض', 'الملاحظات', 'الرادود', 'اسم عربي من القائمة الموثوقة'];
  const body = lines.map(l => [l.id, l.title, l.shown, l.notes, l.reciter, l.arabicName]);
  return '﻿' + [head, ...body].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

async function readLibrary(url, key) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/audio_library?select=id,title,reciter_name&order=id&offset=${from}&limit=1000`, {
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`تعذّرت قراءة المكتبة (${res.status})`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

if (import.meta.url === new URL(`file://${process.argv[1]?.replace(/\\/g, '/').replace(/^(?!\/)/, '/')}`).href) {
  const input = arg('--input');
  const out = arg('--out') ?? 'title-review.csv';
  const trusted = arg('--names') ? JSON.parse(readFileSync(arg('--names'), 'utf8')) : {};
  let rows;
  if (input) rows = JSON.parse(readFileSync(input, 'utf8'));
  else if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) rows = await readLibrary(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  else {
    console.error('اذكر --input ملفاً، أو SUPABASE_URL وSUPABASE_ANON_KEY للقراءة من المكتبة');
    process.exit(2);
  }
  const lines = reviewRows(rows, trusted);
  writeFileSync(out, toCsv(lines), 'utf8');
  console.log(`فُحص ${countOf(rows.length, TRACKS)}، وللمراجعة ${countOf(lines.length, TRACKS)}: ${out}`);
}
