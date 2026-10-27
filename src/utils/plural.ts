// Arabic counts: the noun after a number changes with it (مقطع واحد، مقطعان،
// ثلاثة مقاطع، أحد عشر مقطعاً، مئة مقطع). Which form a number takes comes
// from the language's plural rules.

export type CountForms = { one: string; two: string; few: string; many: string; other: string };

export const TRACKS: CountForms = { one: 'مقطع واحد', two: 'مقطعان', few: 'مقاطع', many: 'مقطعاً', other: 'مقطع' };
export const RELEASES: CountForms = { one: 'إصدار واحد', two: 'إصداران', few: 'إصدارات', many: 'إصداراً', other: 'إصدار' };
export const LISTENS: CountForms = { one: 'استماع واحد', two: 'استماعان', few: 'استماعات', many: 'استماعاً', other: 'استماع' };
export const HOURS: CountForms = { one: 'ساعة واحدة', two: 'ساعتان', few: 'ساعات', many: 'ساعة', other: 'ساعة' };
export const MINUTES: CountForms = { one: 'دقيقة واحدة', two: 'دقيقتان', few: 'دقائق', many: 'دقيقة', other: 'دقيقة' };
export const SECONDS: CountForms = { one: 'ثانية واحدة', two: 'ثانيتان', few: 'ثوانٍ', many: 'ثانية', other: 'ثانية' };
export const DAYS: CountForms = { one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يوماً', other: 'يوم' };

export const RECITERS: CountForms = { one: 'رادود واحد', two: 'رادودان', few: 'رواديد', many: 'رادوداً', other: 'رادود' };
export const PLAYLISTS: CountForms = { one: 'قائمة تشغيل واحدة', two: 'قائمتا تشغيل', few: 'قوائم تشغيل', many: 'قائمة تشغيل', other: 'قائمة تشغيل' };
export const LIKES: CountForms = { one: 'إعجاب واحد', two: 'إعجابان', few: 'إعجابات', many: 'إعجاباً', other: 'إعجاب' };

const rules = new Intl.PluralRules('ar');

/** The noun alone that follows the number, for a number shown apart: "مقاطع", "مقطعاً", "مقطع" */
export function nounAfter(n: number, forms: CountForms): string {
  const kind = rules.select(n);
  return kind === 'few' || kind === 'many' ? forms[kind] : forms.other;
}

// Above a thousand the count is shortened ("12 ألف", "1.2 مليون"), and the
// noun after it stays singular, as after any thousand
const compact = new Intl.NumberFormat('ar-u-nu-latn', { notation: 'compact', maximumFractionDigits: 1 });

/** "377 استماعاً", "12 ألف استماع" */
export const listensOf = (n: number) => (n >= 1000 ? `${compact.format(n)} ${LISTENS.other}` : countOf(n, LISTENS));

/** "1206 مقاطع", "412 مقطعاً", "مقطعان" ... */
export function countOf(n: number, forms: CountForms): string {
  const kind = rules.select(n);
  if (kind === 'one' || kind === 'two') return forms[kind];
  if (kind === 'few' || kind === 'many') return `${n} ${forms[kind]}`;
  return `${n} ${forms.other}`;
}
