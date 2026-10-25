const CATEGORY_MAP: Record<string, { title: string, dbCategories: string[], color: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', dbCategories: ['hussainiya_poems', 'قصائد حسينية'], color: '#7A1F2B' },
  'muwalid': { title: 'مواليد', dbCategories: ['muwalid', 'مواليد'], color: '#1F6B4F' },
  'naei': { title: 'نعي', dbCategories: ['naei', 'نعي'], color: '#5B2A4E' },
  'dua': { title: 'أدعية ومناجاة', dbCategories: ['dua', 'أدعية ومناجاة'], color: '#1D5560' },
  'quran': { title: 'قرآن', dbCategories: ['quran', 'قرآن'], color: '#2D5B3F' },
  'ziyarat': { title: 'زيارات', dbCategories: ['ziyarat', 'زيارات'], color: '#8A5A16' },
  'lectures': { title: 'محاضرات', dbCategories: ['lectures', 'محاضرات'], color: '#2E3A6B' },
  'variety': { title: 'منوعات', dbCategories: ['variety', 'منوعات'], color: '#3D4A57' },
  'nasheed': { title: 'أناشيد إسلامية', dbCategories: ['أناشيد', 'nasheed'], color: '#8A4B26' },
};

export function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((id) => ({
    id: id,
  }));
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
