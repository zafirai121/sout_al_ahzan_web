import type { Metadata, ResolvingMetadata } from 'next';
import CategoryClient from '@/components/CategoryClient';

type Props = {
  params: Promise<{ id: string }>;
};

// Each category's name, and what it holds in a sentence of its own (a name
// with "ال" put before it read wrong: «القصائد حسينية»)
const CATEGORY_MAP: Record<string, { title: string, color: string, about: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', color: '#7A1F2B', about: 'القصائد الحسينية واللطميات' },
  'muwalid': { title: 'مواليد', color: '#1F6B4F', about: 'المواليد والأفراح في ذكرى مواليد أهل البيت عليهم السلام' },
  'naei': { title: 'نعي', color: '#5B2A4E', about: 'النعي الحسيني والمراثي' },
  'dua': { title: 'أدعية ومناجاة', color: '#1D5560', about: 'الأدعية والمناجاة والأذكار' },
  'quran': { title: 'قرآن', color: '#2D5B3F', about: 'تلاوات القرآن الكريم' },
  'ziyarat': { title: 'زيارات', color: '#8A5A16', about: 'زيارات الأئمة عليهم السلام' },
  'lectures': { title: 'محاضرات', color: '#2E3A6B', about: 'المحاضرات والمجالس الحسينية' },
  'variety': { title: 'منوعات', color: '#3D4A57', about: 'منوعات إسلامية' },
  'nasheed': { title: 'أناشيد إسلامية', color: '#8A4B26', about: 'الأناشيد الإسلامية' },
  'afrah': { title: 'مواليد وأفراح', color: '#1F6B4F', about: 'المواليد والأناشيد في أفراح أهل البيت عليهم السلام' },
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const categoryInfo = CATEGORY_MAP[id] || { title: 'تصنيف غير معروف', color: '#333', about: 'المقاطع' };

  const pageTitle = `${categoryInfo.title} | صوت الأحزان`;
  const description = `استمع إلى ${categoryInfo.about} بأصوات أشهر الرواديد والمنشدين، بجودة عالية وبدون إعلانات على منصة صوت الأحزان.`;
  const url = `https://web.soutalahzan.com/category/${id}`;

  return {
    title: pageTitle,
    description: description,
    alternates: { canonical: url },
    openGraph: {
      title: pageTitle,
      description: description,
      url,
      type: 'website',
      images: [{ url: 'https://web.soutalahzan.com/og-image.png', width: 1200, height: 630, alt: 'صوت الأحزان' }],
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: description,
    },
  };
}

// Next.js dynamic param generation for static pages (SSG)
export async function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((id) => ({
    id: id,
  }));
}

export default async function CategoryPageServer({ params }: Props) {
  // Pass the params promise to the client component using React use() hook pattern
  return <CategoryClient params={params} />;
}
