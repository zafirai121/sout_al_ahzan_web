// People type the same Arabic word many ways (احمد / أحمد, فاطمه / فاطمة,
// علي / على). Turn each search word into a case-insensitive regex that matches
// every spelling, for PostgREST's `imatch` operator.
const VARIANTS: Record<string, string> = {
  'ا': '[اأإآ]', 'أ': '[اأإآ]', 'إ': '[اأإآ]', 'آ': '[اأإآ]',
  'ه': '[هة]', 'ة': '[هة]',
  'ي': '[يى]', 'ى': '[يى]',
  'و': '[وؤ]', 'ؤ': '[وؤ]',
};

// Harakat and tatweel are never part of what we match against
const MARKS = /[\u064B-\u0652\u0640]/g;

const toPattern = (word: string): string =>
  [...word.replace(MARKS, '')]
    .map(ch => VARIANTS[ch] ?? ch.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'))
    .join('');

// Quotes, backslashes and commas would break PostgREST's filter syntax
export const searchPatterns = (query: string): string[] =>
  query
    .replace(/["\\,]/g, ' ')
    .split(/\s+/)
    .map(toPattern)
    .filter(Boolean);

// One `.or()` term: the word appears in the title or in the reciter's name
export const titleOrReciter = (pattern: string): string =>
  `title.imatch."${pattern}",reciter_name.imatch."${pattern}"`;
