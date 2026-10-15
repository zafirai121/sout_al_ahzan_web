// The categories' codes, as the apps write and read them, with the older
// spellings some tracks may still carry; and the category a new track's title
// points to, as the apps sort an upload (scripts/categories.mjs sorted the
// library the same way).

export const CATEGORY_VALUES: Record<string, string[]> = {
  hussainiya_poems: ['hussainiya_poems', 'قصائد حسينية', 'لطميات وقصائد', 'لطمية', 'latmiya', 'nazla', 'shoor', 'شور'],
  muwalid: ['muwalid', 'مواليد'],
  naei: ['naei', 'نعي'],
  dua: ['dua', 'أدعية ومناجاة', 'adhkar'],
  quran: ['quran', 'قرآن'],
  ziyarat: ['ziyarat', 'زيارات'],
  lectures: ['lectures', 'محاضرات'],
  variety: ['variety', 'منوعات'],
  nasheed: ['nasheed', 'أناشيد', 'anasheed'],
};

const fold = (s: string) => s.toLowerCase()
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');

// The words that tell a category, most telling first; some only as the
// title's first word ("سورة يس" is the Quran, "سورة الماي" a poem)
const WORDS: [string, { first?: string[]; any?: string[] }][] = [
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
const forms = (w: string) => [w, ...PREFIXES.filter((p) => w.startsWith(p) && w.length > p.length + 2).map((p) => w.slice(p.length))];

/** The category a title points to; a Hussaini poem when it says nothing (as the apps file it). */
export function guessCategory(title: string): string {
  const list = fold(title).split(/[^\p{L}]+/u).filter(Boolean);
  const all = new Set(list.flatMap(forms));
  const first = new Set(list.slice(0, 1).flatMap(forms));
  const found = WORDS.find(([, w]) => (w.any || []).some((k) => all.has(k)) || (w.first || []).some((k) => first.has(k)));
  return found ? found[0] : 'hussainiya_poems';
}
