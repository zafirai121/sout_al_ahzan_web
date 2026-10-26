// The hijri year's occasions, as the phone app shows them on its home screen
// (sawt-alahzan-android: ui/screens/HomeSections.kt, the same list and rules):
// today's occasion, or one coming within ten days, and the tracks it plays.

import { supabase } from '@/lib/supabase';
import { CATEGORY_VALUES } from '@/utils/categories';
import { countOf, DAYS } from '@/utils/plural';
import { DbAudioTrack } from '@/types';

/** What an occasion plays: mourning, joy or prayer, from these categories. */
export type OccasionKind = 'mourning' | 'hussaini' | 'joy' | 'prayer';

const KIND_CATEGORIES: Record<OccasionKind, string[]> = {
  mourning: ['naei', 'hussainiya_poems'],
  hussaini: ['hussainiya_poems', 'naei'],
  joy: ['muwalid', 'nasheed'],
  prayer: ['dua', 'ziyarat'],
};

/**
 * An occasion on `month` (1 = Muharram) from day `from` to `to`. A `season`
 * (the first nights of Muharram, Ramadan...) only counts on its own days; a
 * day of its own also counts the day after, as the new moon is often seen a
 * day later than the calendar says. `honor`: the blessing written small after
 * the name; `line`: two lines under the title; `words`: what its tracks have
 * in their titles; `picture`: what fills the homepage banner's mihrab in place
 * of its lantern, star or crescent.
 */
export interface Occasion {
  month: number;
  from: number;
  to: number;
  kind: OccasionKind;
  title: string;
  honor: string;
  line: string;
  words: string[];
  season?: boolean;
  picture?: Picture;
}

/**
 * A picture of the occasion's place, in public/occasions (cut to the mihrab's
 * shape). Those from Wikimedia Commons carry what their licence asks for: who
 * took it, the licence and where it is, listed on the about page.
 */
export interface Picture {
  src: string;
  place: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  source?: string;
}

const HE = 'عليه السلام';
const SHE = 'عليها السلام';
const day = (month: number, d: number, kind: OccasionKind, title: string, honor: string, line: string, ...words: string[]): Occasion =>
  ({ month, from: d, to: d, kind, title, honor, line, words });
const days = (month: number, from: number, to: number, kind: OccasionKind, title: string, honor: string, line: string, ...words: string[]): Occasion =>
  ({ month, from, to, kind, title, honor, line, words });
const season = (month: number, from: number, to: number, kind: OccasionKind, title: string, honor: string, line: string, ...words: string[]): Occasion =>
  ({ month, from, to, kind, title, honor, line, words, season: true });

const BY_SA_3 = { license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' };
const BY_SA_4 = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' };
const CC0 = { license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' };
const FREE = { license: 'ملك عام' };
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;

export const PICTURES = {
  zahra: { src: '/occasions/zahra-martyrdom.webp', place: 'الزهراء' }, // the site's own
  husayn: { src: '/occasions/husayn.webp', place: 'حرم الإمام الحسين في كربلاء', author: 'Samerhusseini87', ...BY_SA_4, source: commons('حرم الامام الحسين.jpg') },
  abbas: { src: '/occasions/abbas.webp', place: 'حرم أبي الفضل العباس في كربلاء', author: 'David Stanley', ...BY_SA_3, source: commons('Imam Al Abbas Shrine.jpg') },
  arbaeen: { src: '/occasions/arbaeen.webp', place: 'زوار الأربعين في كربلاء', author: 'Larry E. Johns', ...FREE, source: commons('Kerbela Hussein Moschee.jpg') },
  ali: { src: '/occasions/ali.webp', place: 'حرم أمير المؤمنين في النجف', author: 'Toushiro', ...FREE, source: commons('ImamAliMosqueNajafIraq.JPG') },
  reza: { src: '/occasions/reza.webp', place: 'حرم الإمام الرضا في مشهد', author: 'Sepehrnoush', license: 'CC BY 2.5', licenseUrl: 'https://creativecommons.org/licenses/by/2.5/', source: commons('Imam Reza shrine 03.jpg') },
  askari: { src: '/occasions/askari.webp', place: 'حرم العسكريين في سامراء', author: 'Toushiro', ...FREE, source: commons('Al Askari Mosque.jpg') },
  kadhimiya: { src: '/occasions/kadhimiya.webp', place: 'حرم الكاظمين في بغداد', author: 'Taisir Mahdi', ...BY_SA_4, source: commons('العتبة الكاظمية (4).jpg') },
  baqi: { src: '/occasions/baqi.webp', place: 'البقيع في المدينة المنورة', author: 'Saleh Al Hussain', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', source: commons('Al-Baqi Cemetery 2021.jpg') },
  nabawi: { src: '/occasions/nabawi.webp', place: 'المسجد النبوي في المدينة المنورة', author: 'TheHadiRahim', ...CC0, source: commons("Medium shot of the Green Dome at The Prophet's Mosque (Al Masjid-e-Nabawi).jpg") },
  zaynab: { src: '/occasions/zaynab.webp', place: 'حرم السيدة زينب في دمشق', ...FREE, source: commons('Sit Zaynab.JPG') },
  masumeh: { src: '/occasions/masumeh.webp', place: 'حرم السيدة المعصومة في قم', author: 'Mostafa Meraji', ...CC0, source: commons('Fatima Masumeh Shrine Qom Iran Photo By Mustafa Meraji 03.jpg') },
  kaaba: { src: '/occasions/kaaba.webp', place: 'الكعبة المشرفة', author: 'Tab59', ...FREE, source: commons('Mosquée Masjid el Haram à la Mecque.jpg') },
  hira: { src: '/occasions/hira.webp', place: 'جبل النور وغار حراء', author: 'Adiput', ...FREE, source: commons('Jabal Nur.JPG') },
  arafat: { src: '/occasions/arafat.webp', place: 'جبل عرفات', author: 'saudipics', ...BY_SA_4, source: commons('Mount Arafat3.jpg') },
  mualla: { src: '/occasions/mualla.webp', place: 'مقبرة المعلاة في مكة', author: 'Md iet', ...BY_SA_3, source: commons('Jannat-ul-Maualla at present.JPG') },
  jamkaran: { src: '/occasions/jamkaran.webp', place: 'مسجد جمكران في قم', author: 'Mostafa Meraji', ...BY_SA_4, source: commons('Jamkaran Mosque مسجد جمکران قم 10.jpg') },
  ramadan: { src: '/occasions/ramadan.webp', place: 'فانوس رمضان', author: 'Ibrahim.ID', ...BY_SA_3, source: commons('Fanous Ramadan (cropped).jpg') },
  quran: { src: '/occasions/quran.webp', place: 'مصحف مخطوط', author: 'متحف المتروبوليتان للفنون', ...CC0, source: commons("Qur'an Manuscript MET DP235922.jpg") },
} satisfies Record<string, Picture>;

export const OCCASIONS: Occasion[] = [
  { ...day(1, 10, 'hussaini', 'يوم عاشوراء', '', 'يومٌ بكت له السماء..\nوبقي الحسين نداءً لكل الأحرار.', 'عاشوراء', 'الحسين', 'حسين', 'كربلاء', 'الطف'), picture: PICTURES.husayn },
  { ...season(1, 1, 13, 'hussaini', 'ليالي محرم الحرام', '', 'عادت ليالي العزاء..\nفلبيك يا حسين في كل عام.', 'محرم', 'عاشوراء', 'الحسين', 'حسين', 'العباس', 'كربلاء'), picture: PICTURES.husayn },
  { ...day(1, 25, 'mourning', 'شهادة الإمام زين العابدين', HE, 'إمامٌ حمل كربلاء في قلبه..\nفكان دعاؤه نورًا للعارفين.', 'السجاد', 'زين العابدين'), picture: PICTURES.baqi },
  { ...day(2, 20, 'hussaini', 'أربعين الإمام الحسين', HE, 'أربعون يومًا على الفاجعة..\nوالقلوب ما زالت تسير إلى كربلاء.', 'الأربعين', 'اربعين', 'الحسين', 'حسين', 'كربلاء'), picture: PICTURES.arbaeen },
  { ...season(2, 13, 19, 'hussaini', 'على طريق الأربعين', '', 'خطى الزائرين تكتب العشق..\nعلى طريق الحسين إلى كربلاء.', 'الأربعين', 'اربعين', 'المشاية', 'مشاية', 'زوار', 'الحسين'), picture: PICTURES.arbaeen },
  { ...day(2, 28, 'mourning', 'وفاة النبي (ص) وشهادة الإمام الحسن (ع)', '', 'رحل المصطفى ومضى سبطه المجتبى..\nفاتشحت المدينة بالسواد.', 'النبي', 'الرسول', 'المصطفى', 'الحسن', 'المجتبى'), picture: PICTURES.nabawi },
  { ...days(2, 29, 30, 'mourning', 'شهادة الإمام الرضا', HE, 'غريب طوس..\nشمسٌ أشرقت في أرض خراسان.', 'الرضا', 'غريب طوس'), picture: PICTURES.reza },
  { ...day(3, 8, 'mourning', 'شهادة الإمام العسكري', HE, 'إمامٌ عاش في حصار سامراء..\nومضى صابرًا محتسبًا.', 'العسكري'), picture: PICTURES.askari },
  { ...day(3, 17, 'joy', 'مولد النبي الأكرم (ص) والإمام الصادق (ع)', '', 'وُلد الهدى فالكائنات ضياء..\nوأشرق الصادق بعلوم آل محمد.', 'النبي', 'الرسول', 'المصطفى', 'محمد', 'الصادق'), picture: PICTURES.nabawi },
  { ...day(4, 8, 'joy', 'مولد الإمام العسكري', HE, 'نورٌ جديد في بيت النبوة..\nأبو الإمام المنتظر.', 'العسكري'), picture: PICTURES.askari },
  { ...day(5, 5, 'joy', 'مولد السيدة زينب', SHE, 'ميلاد نور في زمن الظلام..\nفكانت زينب، عنوان الصبر والكرامة.', 'زينب'), picture: PICTURES.zaynab },
  { ...day(5, 13, 'mourning', 'الأيام الفاطمية', '', 'أيام الحزن على بضعة المصطفى..\nفاطمة الزهراء سيدة نساء العالمين.', 'الزهراء', 'فاطمة', 'فاطمية', 'الفاطمية'), picture: PICTURES.zahra },
  { ...day(6, 3, 'mourning', 'شهادة السيدة الزهراء', SHE, 'مضت الزهراء مظلومةً..\nوبقي قبرها سرًّا يشهد على المصاب.', 'الزهراء', 'فاطمة', 'فاطمية', 'الفاطمية'), picture: PICTURES.zahra },
  { ...day(6, 20, 'joy', 'مولد السيدة الزهراء', SHE, 'وُلدت الكوثر..\nفأشرق بيت النبوة بنور فاطمة.', 'الزهراء', 'فاطمة'), picture: PICTURES.nabawi },
  { ...day(7, 1, 'joy', 'مولد الإمام الباقر', HE, 'باقر علوم الأولين والآخرين..\nوُلد فازدانت المدينة بنوره.', 'الباقر'), picture: PICTURES.nabawi },
  { ...day(7, 3, 'mourning', 'شهادة الإمام الهادي', HE, 'إمامٌ صابرٌ في سامراء..\nمضى شهيدًا بعيدًا عن مدينة جده.', 'الهادي'), picture: PICTURES.askari },
  { ...day(7, 10, 'joy', 'مولد الإمام الجواد', HE, 'جواد الأئمة..\nكرمٌ وعلمٌ منذ الصغر.', 'الجواد'), picture: PICTURES.kadhimiya },
  { ...day(7, 13, 'joy', 'مولد أمير المؤمنين', HE, 'وُلد في جوف الكعبة..\nفكان عليٌّ ميزان الحق والعدل.', 'علي', 'أمير المؤمنين', 'حيدر', 'الكرار', 'الغدير'), picture: PICTURES.kaaba },
  { ...day(7, 15, 'mourning', 'وفاة السيدة زينب', SHE, 'عقيلة بني هاشم..\nمضت بعد أن حملت رسالة كربلاء.', 'زينب'), picture: PICTURES.zaynab },
  { ...day(7, 25, 'mourning', 'شهادة الإمام الكاظم', HE, 'باب الحوائج إلى الله..\nصبرٌ في ظلمات السجون.', 'الكاظم', 'موسى بن جعفر'), picture: PICTURES.kadhimiya },
  { ...day(7, 27, 'joy', 'المبعث النبوي الشريف', '', 'أشرقت الرسالة..\nفكان محمدٌ رحمةً للعالمين.', 'المبعث', 'النبي', 'الرسول', 'المصطفى', 'محمد'), picture: PICTURES.hira },
  { ...day(8, 3, 'joy', 'مولد الإمام الحسين', HE, 'وُلد الحسين..\nمصباح الهدى وسفينة النجاة.', 'الحسين', 'حسين'), picture: PICTURES.husayn },
  { ...day(8, 4, 'joy', 'مولد أبي الفضل العباس', HE, 'قمر بني هاشم..\nوُلد الوفاء بميلاد أبي الفضل.', 'العباس', 'أبو الفضل', 'ابا الفضل', 'أبي الفضل'), picture: PICTURES.abbas },
  { ...day(8, 5, 'joy', 'مولد الإمام زين العابدين', HE, 'زين العابدين وسيد الساجدين..\nوُلد إمام الدعاء والمناجاة.', 'السجاد', 'زين العابدين'), picture: PICTURES.nabawi },
  { ...day(8, 11, 'joy', 'مولد علي الأكبر', HE, 'أشبه الناس برسول الله خَلقًا وخُلقًا..\nميلادٌ يملأ القلوب فرحًا.', 'الأكبر'), picture: PICTURES.husayn },
  { ...day(8, 15, 'joy', 'مولد الإمام المهدي', 'عجّل الله فرجه', 'ميلاد الأمل المنتظر..\nيملأ الأرض قسطًا وعدلًا.', 'المهدي', 'الحجة', 'صاحب الزمان', 'المنتظر', 'القائم'), picture: PICTURES.jamkaran },
  { ...day(9, 10, 'mourning', 'وفاة السيدة خديجة', SHE, 'أم المؤمنين..\nسند الرسالة في أيامها الأولى.', 'خديجة'), picture: PICTURES.mualla },
  { ...day(9, 15, 'joy', 'مولد الإمام الحسن المجتبى', HE, 'كريم أهل البيت..\nوُلد الحسن فأضاء بيت النبوة.', 'الحسن', 'المجتبى'), picture: PICTURES.nabawi },
  { ...day(9, 21, 'mourning', 'شهادة أمير المؤمنين', HE, 'فزتُ وربِّ الكعبة..\nورحل أمير المؤمنين شهيد المحراب.', 'علي', 'أمير المؤمنين', 'حيدر', 'الكوفة', 'المحراب'), picture: PICTURES.ali },
  { ...season(9, 19, 23, 'prayer', 'ليالي القدر', '', 'ليلةٌ خيرٌ من ألف شهر..\nفأحيوها بالدعاء والقرآن.', 'القدر', 'الجوشن', 'علي', 'أمير المؤمنين'), picture: PICTURES.quran },
  { ...season(9, 1, 30, 'prayer', 'شهر رمضان المبارك', '', 'شهر الله..\nشهر الدعاء والقرآن والمغفرة.', 'رمضان', 'الافتتاح', 'السحر', 'أبو حمزة', 'الجوشن'), picture: PICTURES.ramadan },
  { ...day(10, 1, 'joy', 'عيد الفطر المبارك', '', 'عيدٌ سعيد..\nتقبّل الله طاعاتكم.', 'العيد', 'عيد', 'الفطر'), picture: PICTURES.ramadan },
  { ...day(10, 25, 'mourning', 'شهادة الإمام الصادق', HE, 'رئيس المذهب..\nمضى الصادق وبقيت علومه منارًا.', 'الصادق'), picture: PICTURES.baqi },
  { ...day(11, 1, 'joy', 'مولد السيدة المعصومة', SHE, 'كريمة أهل البيت..\nميلاد فاطمة المعصومة.', 'المعصومة'), picture: PICTURES.masumeh },
  { ...day(11, 11, 'joy', 'مولد الإمام الرضا', HE, 'عالم آل محمد..\nوُلد الرضا فأشرقت المدينة.', 'الرضا'), picture: PICTURES.reza },
  { ...days(11, 29, 30, 'mourning', 'شهادة الإمام الجواد', HE, 'مضى جواد الأئمة شابًّا..\nمسمومًا غريبًا في بغداد.', 'الجواد'), picture: PICTURES.kadhimiya },
  { ...day(12, 7, 'mourning', 'شهادة الإمام الباقر', HE, 'باقر العلوم..\nمضى شهيدًا وبقي علمه نورًا.', 'الباقر'), picture: PICTURES.baqi },
  { ...day(12, 9, 'prayer', 'يوم عرفة', '', 'يوم الدعاء والمناجاة..\nيومٌ تُرجى فيه المغفرة.', 'عرفة', 'عرفه'), picture: PICTURES.arafat },
  { ...day(12, 10, 'joy', 'عيد الأضحى المبارك', '', 'عيد الأضحى المبارك..\nتقبّل الله أعمالكم.', 'العيد', 'عيد', 'الأضحى'), picture: PICTURES.kaaba },
  { ...day(12, 15, 'joy', 'مولد الإمام الهادي', HE, 'الإمام علي الهادي..\nنورٌ من أنوار آل محمد.', 'الهادي'), picture: PICTURES.askari },
  { ...day(12, 18, 'joy', 'عيد الغدير الأغر', '', 'من كنت مولاه فهذا عليٌّ مولاه..\nعيد الله الأكبر.', 'الغدير', 'علي', 'أمير المؤمنين', 'حيدر'), picture: PICTURES.ali },
  { ...day(12, 24, 'joy', 'يوم المباهلة', '', 'يوم المباهلة..\nيومٌ تجلّى فيه فضل أهل البيت.', 'المباهلة', 'أهل البيت', 'الكساء'), picture: PICTURES.nabawi },
];

const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

export interface HijriDate { month: number; day: number }

export const hijriMonthName = (month: number) => HIJRI_MONTHS[month - 1];
export const hijriLabel = (d: HijriDate) => `${d.day} ${hijriMonthName(d.month)}`;

// Umm al-Qura, as the phone app uses, in the visitor's time zone
const umalqura = () => new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric', day: 'numeric' });

export function hijriDate(at: Date, format = umalqura()): HijriDate {
  const parts = format.formatToParts(at);
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { month: part('month'), day: part('day') };
}

const within = (o: Occasion, d: HijriDate) => d.month === o.month && d.day >= o.from && d.day <= o.to;

/** Today's occasion (inDays 0), or one starting within the next ten days. */
export interface OccasionNow { occasion: Occasion; date: HijriDate; inDays: number }

const DAY_MS = 86_400_000;

export function currentOccasion(now = new Date()): OccasionNow | null {
  const format = umalqura();
  const today = hijriDate(now, format);
  const yesterday = hijriDate(new Date(now.getTime() - DAY_MS), format);
  const ownDay = OCCASIONS.find(o => !o.season && within(o, today)) ?? OCCASIONS.find(o => !o.season && within(o, yesterday));
  if (ownDay) return { occasion: ownDay, date: within(ownDay, today) ? today : yesterday, inDays: 0 };
  const inSeason = OCCASIONS.find(o => o.season && within(o, today));
  if (inSeason) return { occasion: inSeason, date: today, inDays: 0 };
  for (let d = 1; d <= 10; d++) {
    const date = hijriDate(new Date(now.getTime() + d * DAY_MS), format);
    const coming = OCCASIONS.find(o => date.month === o.month && date.day === o.from);
    if (coming) return { occasion: coming, date, inDays: d };
  }
  return null;
}

const two = (n: number) => String(n).padStart(2, '0');
/** An occasion's hijri month and first day: "06-03" is the martyrdom of Lady Fatima. */
export const occasionCode = (o: Occasion) => `${two(o.month)}-${two(o.from)}`;

/** The occasions starting in the coming `span` days, soonest first. */
export function upcomingOccasions(now = new Date(), span = 60): OccasionNow[] {
  const format = umalqura();
  const found: OccasionNow[] = [];
  for (let d = 1; d <= span; d++) {
    const date = hijriDate(new Date(now.getTime() + d * DAY_MS), format);
    for (const occasion of OCCASIONS) {
      if (date.month === occasion.month && date.day === occasion.from) found.push({ occasion, date, inDays: d });
    }
  }
  return found;
}

/** "غداً", "بعد يومين", "بعد 5 أيام", "بعد 12 يوماً" */
export const inDaysLabel = (n: number) => (n === 1 ? 'غداً' : `بعد ${n === 2 ? 'يومين' : countOf(n, DAYS)}`);

/**
 * The occasion's tracks, most listened first: titles with one of its words, in
 * the categories it plays (any category if those have too few).
 */
export async function occasionTracks(occasion: Occasion, limit = 12): Promise<DbAudioTrack[]> {
  const anyWord = occasion.words.map(w => `title.ilike."*${w}*"`).join(',');
  const categories = KIND_CATEGORIES[occasion.kind].flatMap(c => CATEGORY_VALUES[c] ?? [c]);
  const query = (inCategories: boolean) => {
    let q = supabase.from('audio_library').select('*').or(anyWord);
    if (inCategories) q = q.in('category', categories);
    return q.order('listen_count', { ascending: false, nullsFirst: false }).limit(limit);
  };
  const { data } = await query(true);
  if (data && data.length >= 4) return data;
  const { data: anyCategory } = await query(false);
  return anyCategory && anyCategory.length > (data?.length ?? 0) ? anyCategory : data ?? [];
}
