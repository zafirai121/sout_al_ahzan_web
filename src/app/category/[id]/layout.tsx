const CATEGORY_MAP: Record<string, { title: string, dbCategories: string[], color: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', dbCategories: ['hussainiya_poems', 'قصائد حسينية'], color: '#8400e7' },
  'muwalid': { title: 'مواليد', dbCategories: ['muwalid', 'مواليد'], color: '#509bf5' },
  'naei': { title: 'نعي', dbCategories: ['naei', 'نعي'], color: '#af2896' },
  'dua': { title: 'أدعية ومناجاة', dbCategories: ['dua', 'أدعية ومناجاة'], color: '#1db954' },
  'quran': { title: 'قرآن', dbCategories: ['quran', 'قرآن'], color: '#006450' },
  'lectures': { title: 'محاضرات', dbCategories: ['lectures', 'محاضرات'], color: '#e1118c' },
  'variety': { title: 'منوعات', dbCategories: ['variety', 'منوعات'], color: '#ff4632' },
  'nasheed': { title: 'أناشيد إسلامية', dbCategories: ['أناشيد', 'nasheed'], color: '#e91429' },
};

export function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((id) => ({
    id: id,
  }));
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
