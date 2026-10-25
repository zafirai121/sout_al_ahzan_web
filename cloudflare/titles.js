// A library title as the apps show it (the same rules as the web app's
// src/uploads.js and the phone app's TrackGuess): readable, without file-name
// junk, without the name of its reciter, who is shown beside it anyway.
// "يا حسين - الرادود باسم الكربلائي" → "يا حسين".

const normalize = (s) => String(s || '').toLowerCase()
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');

const EDGES = ' -–—_|.·:،,';
const trimEdges = (s) => {
  let a = 0;
  let b = s.length;
  while (a < b && (/\s/.test(s[a]) || EDGES.includes(s[a]))) a++;
  while (b > a && (/\s/.test(s[b - 1]) || EDGES.includes(s[b - 1]))) b--;
  return s.slice(a, b);
};

// yt-dlp writes the characters a file name can't hold as look-alikes ("/" as
// "⧸", "|" as "｜"); fonts lack some and draw them as a huge stroke over the title.
// The same map as src/utils/data_mapper.ts.
const FILE_NAME_LOOKALIKES = { '⧸': '/', '⧹': '\\', '｜': '|', '：': ':', '？': '?', '＂': '"', '＊': '*', '＜': '<', '＞': '>' };

/** Without what can't be read: U+FFFC, U+FFFD, stray control characters and file-name look-alikes. */
export const cleanText = (s) => String(s ?? '').replace(/[￼�]|[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '')
  .replace(/[⧸⧹｜：？＂＊＜＞]/g, (c) => FILE_NAME_LOOKALIKES[c]).replace(/ {2,}/g, ' ').trim();

const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|wma|amr|3gp|mp4|webm)$/i;
const SITE = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|info|ir|iq|tv|me|co)\b\S*/gi;
const HANDLE = /@[\w.]+/g;
const JUNK_IN_BRACKETS = /[[(【{][^\])】}]*(official|video|audio|lyric|hd|4k|mp3|kbps|clip|حصري|فيديو|كليب|اوديو|أوديو|نسخة|جودة|تصميم)[^\])】}]*[\])】}]/gi;
const JUNK_WORDS = /\b(\d{2,3}\s?kbps|\d{3}k|official\s+(video|audio)|lyrics?\s+video|hq|hd)\b/gi;
const TRACK_NUMBER = /^\s*(track\s*)?\d{1,2}\s*[-._)]+\s*/i;

/** Without its file extension, track number, site, "(Official Video)" and such. */
function cleanTitle(s) {
  let t = String(s || '').replace(AUDIO_EXT, '').replace(/_/g, ' ');
  t = t.replace(JUNK_IN_BRACKETS, ' ').replace(SITE, ' ').replace(HANDLE, ' ').replace(JUNK_WORDS, ' ');
  t = t.replace(TRACK_NUMBER, '');
  t = t.replace(/[[(]\s*[\])]/g, ' ').replace(/\s+/g, ' ');
  return trimEdges(t);
}

const HONORIFICS = new Set(['الرادود', 'الملا', 'ملا', 'السيد', 'سيد', 'الشيخ', 'شيخ', 'الحاج', 'حاج', 'المنشد', 'القاري', 'الخطيب']);
function nameKey(s) {
  const words = normalize(s).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const kept = words.filter((w) => !HONORIFICS.has(w));
  return (kept.length ? kept : words).join(' ');
}

// Words before a reciter's name in a title that say who they are ("الرادود", "بصوت"), as compared
const BEFORE_NAME = new Set(['الرادود', 'رادود', 'للرادود', 'الملا', 'ملا', 'للملا', 'السيد', 'سيد', 'للسيد', 'الشيخ', 'شيخ', 'للشيخ',
  'الحاج', 'حاج', 'للحاج', 'المنشد', 'منشد', 'للمنشد', 'القاري', 'الخطيب', 'بصوت', 'اداء', 'باداء']);
const SEPARATOR = /^[-–—_|ـ:،,.·/\\]+$/;

/**
 * `title` without the name of its reciter (`names`), with the words before it
 * that say who they are and the dash beside it. A name of one word is left (it
 * could be any word of the title), and so is a title left with no words.
 */
function withoutReciter(title, ...names) {
  let t = String(title).replace(/\s+/g, ' ').trim();
  for (const name of new Set(names.filter(Boolean))) {
    const words = nameKey(name).split(' ').filter(Boolean);
    if (words.length < 2 || !normalize(t).includes(words[words.length - 1])) continue;
    for (let round = 0; round < 3; round++) {
      const tokens = t.split(' ');
      const cores = normalize(t).split(' ').map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''));
      const at = cores.findIndex((_, i) => words.every((w, k) => cores[i + k] === w
        || (k === 0 && (cores[i] === `ل${w}` || cores[i] === `ب${w}`))));
      if (at < 0) break;
      let s = at;
      let e = at + words.length;
      for (;;) {
        if (s > 0 && BEFORE_NAME.has(cores[s - 1])) s--;
        else if (s > 1 && cores[s - 1] === 'الحسيني' && BEFORE_NAME.has(cores[s - 2])) s -= 2;
        else break;
      }
      const open = tokens[s].match(/^[([{«]*/)[0];
      const close = tokens[e - 1].match(/[)\]}»]*$/)[0];
      if (s > 0 && SEPARATOR.test(tokens[s - 1])) s--;
      else if (e < tokens.length && SEPARATOR.test(tokens[e])) e++;
      const rest = [...tokens.slice(0, s), open + close, ...tokens.slice(e)].join(' ')
        .replace(/[([{«]\s*[)\]}»]/g, ' ').replace(/([([{«])\s+/g, '$1').replace(/\s+([)\]}»])/g, '$1')
        .replace(/\s+/g, ' ');
      let left = trimEdges(rest);
      if (/^\([^()]*\)$/.test(left)) left = left.slice(1, -1).trim();
      if (!/\p{L}.*\p{L}/u.test(left)) break;
      t = left;
    }
  }
  return t;
}

/** A track's title as shown: readable, without junk, without its reciter's name. */
export function shownTitle(title, ...names) {
  const clean = cleanText(title);
  const t = cleanTitle(clean);
  return withoutReciter(/\p{L}/u.test(t) ? t : clean, ...names);
}
