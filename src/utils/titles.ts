// The technical numbering some titles carry from the files or lists they came
// from ("1243. 1243. كلهم الراحو حسين", "784. ناديتك", "008 - نار الهجر",
// "03 - يا حسين"), left out where a title is shown. The title the library keeps
// is not changed (editing shows it as it is); only these few verified shapes go,
// and the title stays whole when nothing but them would be left. A number that
// is part of the name ("313 يا مهدي", "313 - يا مهدي") stays. The phone and web
// app follow the same rules (src/uploads.js there). Titles the rules don't
// settle are listed for a person to review (scripts/title-review.mjs).

// The same index twice: "1243. 1243. "
const REPEATED_INDEX = /^\s*([0-9٠-٩]{1,5})\s*[.\-–—_)]\s*\1\s*[.\-–—_)]\s*/;
// A track's number from a list or an album: "03 - ", "7. ", "Track 12 - "
const TRACK_NUMBER = /^\s*(track\s*)?[0-9٠-٩]{1,2}\s*[-._)]+\s*/i;
// A longer index with a full stop after it: "784. "
const DOTTED_INDEX = /^\s*[0-9٠-٩]{3,5}\.\s+/;
// A zero-padded index: "008 - "
const PADDED_INDEX = /^\s*[0٠][0-9٠-٩]{2,4}\s*[-–—_.)]\s*/;

const HAS_WORDS = /\p{L}.*\p{L}/u;

/** The title without its technical numbering; the title as it was when only that would be left. */
export function withoutTechnicalNumbering(title: string): string {
  let t = title.replace(REPEATED_INDEX, '');
  t = t.replace(TRACK_NUMBER, '').replace(DOTTED_INDEX, '').replace(PADDED_INDEX, '').trim();
  return HAS_WORDS.test(t) ? t : title.trim();
}

/** What a person reviewing the titles should look at (nothing is changed by it). */
export function titleNotes(title: string): string[] {
  const notes: string[] = [];
  if (withoutTechnicalNumbering(title) !== title.trim()) notes.push('ترقيم تقني');
  if (/[|｜]/.test(title)) notes.push('فاصل عمودي');
  if (/\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i.test(title.trim())) notes.push('امتداد ملف');
  const words = title.trim().split(/\s+/);
  if (words.length >= 4 && words.length % 2 === 0 && words.slice(0, words.length / 2).join(' ') === words.slice(words.length / 2).join(' ')) notes.push('تكرار');
  return notes;
}

/** A reciter's name in Latin letters only (it may have an Arabic name to review). */
export const isLatinName = (name: string) => /^[A-Za-z][A-Za-z .'_-]*$/.test(name.trim());
