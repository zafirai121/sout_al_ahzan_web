// Arabic counts: the noun after a number changes with it (مقطع واحد، مقطعان،
// ثلاثة مقاطع، أحد عشر مقطعاً، مئة مقطع). Which form a number takes comes
// from the language's plural rules.

export type CountForms = { one: string; two: string; few: string; many: string; other: string };

export const TRACKS: CountForms = { one: 'مقطع واحد', two: 'مقطعان', few: 'مقاطع', many: 'مقطعاً', other: 'مقطع' };
export const RELEASES: CountForms = { one: 'إصدار واحد', two: 'إصداران', few: 'إصدارات', many: 'إصداراً', other: 'إصدار' };
export const LISTENS: CountForms = { one: 'استماع واحد', two: 'استماعان', few: 'استماعات', many: 'استماعاً', other: 'استماع' };
export const MINUTES: CountForms = { one: 'دقيقة واحدة', two: 'دقيقتان', few: 'دقائق', many: 'دقيقة', other: 'دقيقة' };
export const SECONDS: CountForms = { one: 'ثانية واحدة', two: 'ثانيتان', few: 'ثوانٍ', many: 'ثانية', other: 'ثانية' };
export const DAYS: CountForms = { one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يوماً', other: 'يوم' };

const rules = new Intl.PluralRules('ar');

/** "1206 مقاطع", "412 مقطعاً", "مقطعان" ... */
export function countOf(n: number, forms: CountForms): string {
  const kind = rules.select(n);
  if (kind === 'one' || kind === 'two') return forms[kind];
  if (kind === 'few' || kind === 'many') return `${n} ${forms[kind]}`;
  return `${n} ${forms.other}`;
}
